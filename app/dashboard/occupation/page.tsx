import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import OccupationChart from '@/components/dashboard/occupation-chart'
import type { Lease, Payment, Property } from '@/lib/types'

function buildChartData(
  leases: Pick<Lease, 'start_date' | 'end_date'>[],
  totalRental: number
) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const active = leases.filter((l) => {
      const start = new Date(l.start_date)
      const end = new Date(l.end_date)
      return start <= monthEnd && end >= d
    }).length
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      rate: totalRental > 0 ? Math.round((active / totalRental) * 100) : 0,
    }
  })
}

export default async function OccupationPage() {
  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const [
    { data: rentalProperties },
    { data: activeLeases },
    { data: allLeases },
    { data: latePayments },
  ] = await Promise.all([
    supabase.from('properties').select('id, title, neighborhood, city, status').eq('transaction_type', 'location'),
    supabase.from('leases').select('*, tenant:tenant_id(full_name, whatsapp), property:property_id(title)').eq('status', 'actif'),
    supabase.from('leases').select('start_date, end_date'),
    supabase
      .from('payments')
      .select('*, lease:lease_id(monthly_rent, tenant:tenant_id(full_name, whatsapp), property:property_id(title))')
      .eq('status', 'retard'),
  ])

  const totalRental = rentalProperties?.length ?? 0
  const rented = rentalProperties?.filter((p) => p.status === 'loue').length ?? 0
  const occupationRate = totalRental > 0 ? Math.round((rented / totalRental) * 100) : 0

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount_fcfa, status, due_date')
    .gte('due_date', startOfMonth)
    .lte('due_date', endOfMonth)

  const encaisse = (monthPayments ?? []).filter((p) => p.status === 'paye').reduce((s, p) => s + (p.amount_fcfa ?? 0), 0)
  const attendu = (activeLeases ?? []).reduce((s, l) => s + (l.monthly_rent ?? 0), 0)

  const chartData = buildChartData(allLeases ?? [], totalRental)

  type LatePaymentRow = Payment & {
    lease?: {
      monthly_rent: number
      tenant?: { full_name: string; whatsapp: string | null } | null
      property?: { title: string } | null
    } | null
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold text-[#181818]">Taux d&apos;occupation</h2>
        <p className="text-sm text-[#62605B] mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Taux d'occupation", value: `${occupationRate}%`, sub: `${rented} biens loués / ${totalRental}`, positive: occupationRate >= 70 },
          { label: 'Biens en location', value: `${rented} / ${totalRental}`, sub: `${totalRental - rented} disponibles`, positive: true },
          { label: 'Revenus encaissés', value: formatFCFA(encaisse), sub: 'Ce mois', positive: true },
          { label: 'Revenus attendus', value: formatFCFA(attendu), sub: encaisse < attendu ? `Écart : ${formatFCFA(attendu - encaisse)}` : 'Objectif atteint', positive: encaisse >= attendu },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-[#181818]/[0.08] rounded-2xl p-4 lg:p-5">
            <p className="text-2xl font-bold text-[#181818] mb-1">{m.value}</p>
            <p className="text-xs text-[#91908C]">{m.label}</p>
            <p className={`text-xs mt-1 font-medium ${m.positive ? 'text-[#1F8A5B]' : 'text-red-600'}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique 6 mois */}
      <div className="bg-white border border-[#181818]/[0.08] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#181818] mb-4">Occupation sur 6 mois</h3>
        <OccupationChart data={chartData} />
      </div>

      {/* Retards de paiement */}
      <div className="bg-white border border-[#181818]/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#181818]/[0.08]">
          <h3 className="text-sm font-semibold text-[#181818]">
            Retards de paiement
            {(latePayments?.length ?? 0) > 0 && (
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600">
                {latePayments!.length}
              </span>
            )}
          </h3>
        </div>
        {!latePayments?.length ? (
          <p className="px-5 py-8 text-sm text-[#A09E96] text-center">Aucun retard de paiement</p>
        ) : (
          <div className="divide-y divide-[#181818]/[0.06]">
            {(latePayments as LatePaymentRow[]).map((p) => {
              const daysLate = Math.floor((now.getTime() - new Date(p.due_date).getTime()) / 86_400_000)
              const phone = p.lease?.tenant?.whatsapp ?? ''
              const msg = encodeURIComponent(
                `Bonjour ${p.lease?.tenant?.full_name ?? ''}, votre loyer de ${formatFCFA(p.amount_fcfa)} pour ${p.lease?.property?.title ?? 'votre bien'} est en retard de ${daysLate} jour(s). Merci de régulariser.`
              )
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#181818]/[0.02] transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181818] truncate">{p.lease?.tenant?.full_name ?? '—'}</p>
                    <p className="text-xs text-[#91908C] truncate">{p.lease?.property?.title ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{formatFCFA(p.amount_fcfa)}</p>
                    <p className="text-xs text-[#A09E96]">{daysLate}j de retard</p>
                  </div>
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold rounded-lg transition"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Statut des biens en location */}
      <div className="bg-white border border-[#181818]/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#181818]/[0.08]">
          <h3 className="text-sm font-semibold text-[#181818]">Biens en location</h3>
        </div>
        <div className="divide-y divide-[#181818]/[0.06]">
          {(rentalProperties as Property[] ?? []).map((prop) => {
            const lease = (activeLeases ?? []).find((l) => l.property_id === prop.id)
            const endDate = lease ? new Date(lease.end_date) : null
            const daysToEnd = endDate ? Math.floor((endDate.getTime() - now.getTime()) / 86_400_000) : null
            const expiringSoon = daysToEnd !== null && daysToEnd <= 30 && daysToEnd >= 0
            return (
              <div key={prop.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#181818]/[0.02] transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#181818] truncate">{prop.title}</p>
                  <p className="text-xs text-[#91908C] truncate">
                    {prop.neighborhood ? `${prop.neighborhood}, ` : ''}{prop.city}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {prop.status === 'loue' && lease ? (
                    <>
                      <p className="text-xs font-medium text-[#181818] truncate max-w-[120px]">
                        {(lease as Lease & { tenant?: { full_name: string } | null }).tenant?.full_name ?? '—'}
                      </p>
                      <p className={`text-xs ${expiringSoon ? 'text-orange-600' : 'text-[#A09E96]'}`}>
                        {expiringSoon ? `Expire dans ${daysToEnd}j` : endDate ? `Fin ${endDate.toLocaleDateString('fr-FR')}` : '—'}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-[#1F8A5B]">Disponible</span>
                  )}
                </div>
              </div>
            )
          })}
          {!rentalProperties?.length && (
            <p className="px-5 py-8 text-sm text-[#A09E96] text-center">Aucun bien en location</p>
          )}
        </div>
      </div>
    </div>
  )
}
