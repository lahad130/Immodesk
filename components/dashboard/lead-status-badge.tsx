import type { LeadStatus } from '@/lib/types'

const config: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  chaud:   { label: 'Chaud',   bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  tiede:   { label: 'Tiède',   bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  nouveau: { label: 'Nouveau', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  froid:   { label: 'Froid',   bg: 'bg-[#3ECF8E]/10',  text: 'text-[#3ECF8E]',  dot: 'bg-[#3ECF8E]' },
}

export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
