import { createClient } from '@/lib/supabase/server'
import type { Lead, Visit } from '@/lib/types'
import LeadStatusBadge from '@/components/dashboard/lead-status-badge'
import Link from 'next/link'

function formatFCFA(n: number | null | undefined) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { count: leadsThisMonth },
    { count: leadsLastMonth },
    { count: visitsScheduled },
    { count: activeProperties },
    { data: recentLeads },
    { data: upcomingVisits },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', lastMonth).lt('created_at', startOfMonth),
    supabase.from('visits').select('*', { count: 'exact', head: true }).gte('scheduled_at', now.toISOString()).eq('status', 'planifiee'),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'disponible'),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('visits').select('*, lead:lead_id(full_name), property:property_id(title, neighborhood)').gte('scheduled_at', now.toISOString()).eq('status', 'planifiee').order('scheduled_at').limit(5),
  ])

  const growth = leadsLastMonth ? Math.round(((( leadsThisMonth ?? 0) - (leadsLastMonth ?? 0)) / (leadsLastMonth ?? 1)) * 100) : 0
  const hotLeads = (recentLeads ?? []).filter((l) => l.status === 'chaud').length
  const conversionRate = leadsThisMonth ? ((hotLeads / (leadsThisMonth ?? 1)) * 100).toFixed(1) : '0'

  const metrics = [
    {
      label: 'Leads ce mois',
      value: leadsThisMonth ?? 0,
      sub: growth >= 0 ? `+${growth}% vs mois dernier` : `${growth}% vs mois dernier`,
      positive: growth >= 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Visites planifiées',
      value: visitsScheduled ?? 0,
      sub: 'Prochaines 30 jours',
      positive: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Taux de conversion',
      value: `${conversionRate}%`,
      sub: `${hotLeads} leads chauds`,
      positive: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'Biens actifs',
      value: activeProperties ?? 0,
      sub: 'Disponibles à la vente/location',
      positive: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-semibold text-white">Bonjour 👋</h2>
        <p className="text-sm text-[#888] mt-0.5">Voici l&apos;activité de votre agence aujourd&apos;hui.</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#171717] border border-white/[0.08] rounded-2xl p-4 lg:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#3ECF8E]/10 flex items-center justify-center text-[#3ECF8E]">
                {m.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{m.value}</p>
            <p className="text-xs text-[#666] leading-snug">{m.label}</p>
            <p className={`text-xs mt-1 font-medium ${m.positive ? 'text-[#3ECF8E]' : 'text-red-400'}`}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Two columns: leads + visits */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent leads (3/5) */}
        <div className="lg:col-span-3 bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <h3 className="text-sm font-semibold text-white">Derniers leads</h3>
            <Link href="/dashboard/leads" className="text-xs text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {(recentLeads as Lead[])?.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition">
                <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {lead.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
                  <p className="text-xs text-[#666] truncate">
                    {lead.property_type ?? 'Non précisé'} · {lead.budget_max ? formatFCFA(lead.budget_max) : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <LeadStatusBadge status={lead.status} />
                  <span className="text-[10px] text-[#555]">{timeAgo(lead.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming visits (2/5) */}
        <div className="lg:col-span-2 bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
            <h3 className="text-sm font-semibold text-white">Prochaines visites</h3>
            <Link href="/dashboard/visits" className="text-xs text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {(upcomingVisits as (Visit & { lead?: { full_name: string } | null; property?: { title: string; neighborhood: string | null } | null })[])?.map((visit) => (
              <div key={visit.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {visit.property?.title ?? <span className="text-[#555]">Non assigné</span>}
                    </p>
                    <p className="text-xs text-[#666] mt-0.5 truncate">
                      {visit.lead?.full_name ?? '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[#3ECF8E]">
                      {new Date(visit.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-[#666]">
                      {new Date(visit.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!upcomingVisits || upcomingVisits.length === 0) && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#555]">Aucune visite planifiée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
