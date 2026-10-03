const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

export function formatRelative(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return '—'
  const days = Math.round((new Date(iso).getTime() - now) / 86_400_000)
  if (Number.isNaN(days)) return '—'
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), 'month')
  return rtf.format(Math.round(days / 365), 'year')
}
