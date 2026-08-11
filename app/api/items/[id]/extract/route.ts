import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractDocumentTerms } from '@/lib/claude'
import type { RenewalItem } from '@/lib/types'

export const dynamic = 'force-dynamic'
// PDF upload plus a Claude call takes longer than the existing routes.
export const maxDuration = 90

// Vercel's default serverless request body limit is 4.5MB on the Hobby
// plan. Reject an oversized file here with a clear error instead of letting
// the platform fail the request partway through with an opaque 413.
const MAX_FILE_BYTES = 4 * 1024 * 1024

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: item, error: fetchError } = await supabaseAdmin
    .from('renewal_items')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'File is too large. Maximum size is 4MB.' },
      { status: 413 }
    )
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  // One file per item — a fixed path means a new upload replaces the old
  // one, matching the "new upload replaces the old" storage decision.
  const storagePath = `${id}/document.pdf`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('renewal-documents')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('Storage upload failed:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  try {
    const proposedValues = await extractDocumentTerms(fileBuffer.toString('base64'))

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('renewal_items')
      .update({
        source_document_url: storagePath,
        extraction_status: 'pending_review',
        proposed_values: proposedValues,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated as RenewalItem)
  } catch (err) {
    console.error('Document extraction failed:', err)

    // The file is uploaded and safely stored even if extraction fails, so
    // the item isn't left half-updated and the upload can be retried
    // without re-attaching the document.
    const { data: withDocOnly, error: updateError } = await supabaseAdmin
      .from('renewal_items')
      .update({
        source_document_url: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Document uploaded, but extraction failed', item: withDocOnly },
      { status: 502 }
    )
  }
}
