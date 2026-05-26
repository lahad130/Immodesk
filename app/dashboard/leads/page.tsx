import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/lib/types'
import LeadStatusBadge from '@/components/dashboard/lead-status-badge'

function formatFCFA(n: number | null | undefined) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const sourceLabels: Record<string, string> = {
  site_web: 'Site web',
  referral: 'Référence',
  reseaux_sociaux: 'Réseaux sociaux',
  appel_direct: 'Appel direct',
  agence: 'Agence',
}

const statusCounts = (leads: Lead[]) => ({
  chaud: leads.filter((l) => l.status === 'chaud').length,
  tiede: leads.filter((l) => l.status === 'tiede').length,
  nouveau: leads.filter((l) => l.status === 'nouveau').length,
  froid: leads.filter((l) => l.status === 'froid').length,
})

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const counts = statusCounts((leads as Lead[]) ?? [])

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Leads</h2>
          <p className="text-sm text-[#888]">{leads?.length ?? 0} leads au total</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau lead
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'chaud', label: 'Chaud', count: counts.chaud, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
            { key: 'tiede', label: 'Tiède', count: counts.tiede, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { key: 'nouveau', label: 'Nouveau', count: counts.nouveau, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { key: 'froid', label: 'Froid', count: counts.froid, color: 'text-[#3ECF8E] bg-[#3ECF8E]/10 border-[#3ECF8E]/20' },
          ] as const
        ).map((s) => (
          <div
            key={s.key}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${s.color}`}
          >
            {s.label}
            <span className="opacity-70">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Contact', 'Statut', 'Budget', 'Type', 'Source', 'Dernier contact', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-[#555] uppercase tracking-wide px-4 py-3 first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(leads as Lead[])?.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition group">
                  {/* Contact */}
                  <td className="px-4 py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {lead.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{lead.full_name}</p>
                        <p className="text-xs text-[#666]">{lead.phone ?? lead.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <LeadStatusBadge status={lead.status} />
                  </td>

                  {/* Budget */}
                  <td className="px-4 py-3.5">
                    <span className="text-white">{formatFCFA(lead.budget_max)}</span>
                    {lead.budget_min && lead.budget_max && (
                      <p className="text-[10px] text-[#555]">{formatFCFA(lead.budget_min)} – {formatFCFA(lead.budget_max)}</p>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-[#aaa]">{lead.property_type ?? '—'}</span>
                    <p className="text-[10px] text-[#555] capitalize">{lead.transaction_type}</p>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3.5 text-[#888]">
                    {lead.source ? sourceLabels[lead.source] ?? lead.source : '—'}
                  </td>

                  {/* Last contact */}
                  <td className="px-4 py-3.5 text-[#666] text-xs">
                    {formatDate(lead.last_contact_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 pr-5">
                    <button className="opacity-0 group-hover:opacity-100 transition p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.07]">
          <p className="text-xs text-[#555]">{leads?.length ?? 0} résultats</p>
        </div>
      </div>
    </div>
  )
}
