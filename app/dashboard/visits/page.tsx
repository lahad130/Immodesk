import { createClient } from '@/lib/supabase/server'

const statusConfig = {
  planifiee: { label: 'Planifiée', className: 'text-blue-400 bg-blue-500/10' },
  effectuee: { label: 'Effectuée', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  annulee:   { label: 'Annulée',   className: 'text-[#555] bg-white/5' },
}

export default async function VisitsPage() {
  const supabase = await createClient()
  const { data: visits } = await supabase
    .from('visits')
    .select('*, lead:lead_id(full_name, phone), property:property_id(title, neighborhood, city)')
    .order('scheduled_at', { ascending: true })

  const now = new Date()
  const upcoming = visits?.filter((v) => new Date(v.scheduled_at) >= now) ?? []
  const past = visits?.filter((v) => new Date(v.scheduled_at) < now) ?? []

  function VisitRow({ visit }: { visit: typeof visits extends (infer T)[] | null | undefined ? T : never }) {
    const sc = statusConfig[(visit as { status: keyof typeof statusConfig }).status] ?? statusConfig.planifiee
    const d = new Date((visit as { scheduled_at: string }).scheduled_at)
    const isPast = d < now

    return (
      <div className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition border-b border-white/[0.05] last:border-0 ${isPast ? 'opacity-60' : ''}`}>
        {/* Date block */}
        <div className="w-12 text-center shrink-0">
          <p className="text-lg font-bold text-white leading-none">{d.getDate()}</p>
          <p className="text-[10px] text-[#555] uppercase mt-0.5">
            {d.toLocaleDateString('fr-FR', { month: 'short' })}
          </p>
        </div>

        {/* Time */}
        <div className="w-12 text-center shrink-0">
          <p className="text-xs font-semibold text-[#3ECF8E]">
            {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {(visit as { property?: { title: string } | null }).property?.title ?? <span className="text-[#555]">Non assigné</span>}
          </p>
          <p className="text-xs text-[#666] truncate">
            {(visit as { lead?: { full_name: string; phone?: string } | null }).lead?.full_name ?? '—'}
            {(visit as { lead?: { phone?: string } | null }).lead?.phone && ` · ${(visit as { lead: { phone: string } }).lead.phone}`}
          </p>
        </div>

        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${sc.className}`}>
          {sc.label}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Visites</h2>
          <p className="text-sm text-[#888]">{upcoming.length} à venir · {past.length} passées</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Planifier une visite
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.07]">
            <h3 className="text-xs font-semibold text-[#3ECF8E] uppercase tracking-wider">À venir</h3>
          </div>
          {upcoming.map((v) => <VisitRow key={v.id} visit={v} />)}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.07]">
            <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider">Passées</h3>
          </div>
          {past.slice(0, 10).map((v) => <VisitRow key={v.id} visit={v} />)}
        </div>
      )}
    </div>
  )
}
