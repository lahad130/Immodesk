export function formatFCFA(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Md FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

export function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysLate(dueDateStr: string): number {
  const diff = Date.now() - new Date(dueDateStr).getTime()
  return Math.floor(diff / 86_400_000)
}
