import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// The storage bucket is private, so the stored source_document_url is a
// path, not a browsable link. This route signs a short-lived URL on demand
// and redirects to it, rather than exposing a long-lived public link.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: item, error } = await supabaseAdmin
    .from('renewal_items')
    .select('source_document_url')
    .eq('id', id)
    .single()

  if (error || !item?.source_document_url) {
    return NextResponse.json({ error: 'No document attached' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from('renewal-documents')
    .createSignedUrl(item.source_document_url, 60)

  if (signError || !signed) {
    return NextResponse.json({ error: 'Could not generate document link' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
