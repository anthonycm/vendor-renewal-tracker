// expirationDate is a plain "YYYY-MM-DD" date (Supabase `date` column).
// Computed in UTC calendar days so the result doesn't shift with server timezone.
export function daysRemaining(expirationDate: string): number {
  const today = new Date()
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  )
  const [year, month, day] = expirationDate.split('-').map(Number)
  const expirationUTC = Date.UTC(year, month - 1, day)
  return Math.round((expirationUTC - todayUTC) / 86400000)
}

export function isStale(lastFlaggedAt: string | null): boolean {
  if (!lastFlaggedAt) return true
  return Date.now() - new Date(lastFlaggedAt).getTime() > 24 * 60 * 60 * 1000
}
