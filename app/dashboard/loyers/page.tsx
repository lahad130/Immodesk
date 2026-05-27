import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import RevenusChart from '@/components/dashboard/revenus-chart'

export default async function LoyersPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  // Loyers attendus ce mois = somme des loyers mensuels des baux actifs
  const { data: activeLeases } = await supabase
    .from('leases')
    .select('id, monthly_rent')
    .eq('status', 'actif')

  const loyersAttendus = (activeLeases ?? []).reduce((sum, l) => sum + (l.monthly_rent as number), 0)

  // Loyers reçus ce mois = paiements payés avec due_date ce mois
  const { data: paymentsDuThisMonth } = await supabase
    .from('payments')
    .select('amount_fcfa, status')
    .gte('due_date', startOfMonth)
    .lte('due_date', endOfMonth)

  const loyersRecus = (paymentsDuThisMonth ?? [])
    .filter((p) => p.status === 'paye')
    .reduce((sum, p) => sum + (p.amount_fcfa as number), 0)

  const tauxRecouvrement = loyersAttendus > 0 ? Math.round((loyersRecus / loyersAttendus) * 100) : 0

  // Paiements en retard avec info locataire + bien
  const { data: retardPayments } = await supabase
    .from('payments')
    .select(`
      id,
      amount_fcfa,
      due_date,
      lease:lease_id(
        id,
        tenant:tenant_id(full_name, whatsapp),
        property:property_id(title)
      )
    `)
    .eq('status', 'retard')
    .order('due_date', { ascending: true })
    .limit(20)

  // Données graphique 6 mois
  const monthData: { month: string; attendus: number; recus: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = d.toISOString().slice(0, 10)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })

    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount_fcfa, status')
      .gte('due_date', start)
      .lte('due_date', end)

    const recus = (monthPayments ?? [])
      .filter((p) => p.status === 'paye')
      .reduce((sum, p) => sum + (p.amount_fcfa as number), 0)

    monthData.push({ month: label, attendus: loyersAttendus, recus })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Loyers</h2>
        <p className="text-sm text-[#888]">Vue d&apos;ensemble des encaissements</p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Attendus ce mois</p>
          <p className="text-2xl font-bold text-white">{formatFCFA(loyersAttendus)}</p>
          <p className="text-xs text-[#666] mt-1">{(activeLeases ?? []).length} bail{(activeLeases ?? []).length !== 1 ? 's' : ''} actif{(activeLeases ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Reçus ce mois</p>
          <p className="text-2xl font-bold text-[#3ECF8E]">{formatFCFA(loyersRecus)}</p>
          <p className="text-xs text-[#666] mt-1">Paiements validés</p>
        </div>
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Taux recouvrement</p>
          <p className={`text-2xl font-bold ${tauxRecouvrement >= 80 ? 'text-[#3ECF8E]' : tauxRecouvrement >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
            {tauxRecouvrement}%
          </p>
          <p className="text-xs text-[#666] mt-1">{formatFCFA(loyersAttendus - loyersRecus)} restant</p>
        </div>
      </div>

      {/* Graphique 6 mois */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">Revenus 6 derniers mois</h3>
        </div>
        <div className="p-5">
          <RevenusChart data={monthData} />
        </div>
      </div>

      {/* Impayés + relances WhatsApp */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">Impayés — relances WhatsApp</h3>
          <p className="text-xs text-[#666] mt-0.5">
            {(retardPayments ?? []).length} paiement{(retardPayments ?? []).length !== 1 ? 's' : ''} en retard
          </p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(retardPayments ?? []).length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-[#555]">Aucun impayé</p>
            </div>
          ) : (
            (retardPayments ?? []).map((pmt) => {
              type LeaseJoined = {
                id: string
                tenant: { full_name: string; whatsapp: string | null } | null
                property: { title: string } | null
              } | null
              const lease = pmt.lease as unknown as LeaseJoined
              const tenant = lease?.tenant ?? null
              const whatsapp = (tenant?.whatsapp ?? '').replace(/\D/g, '')
              const dueDate = new Date(pmt.due_date as string)
              const daysLate = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000))
              const propertyTitle = lease?.property?.title ?? 'Bien non assigné'
              const waMessage = encodeURIComponent(
                `Bonjour ${tenant?.full_name ?? 'cher locataire'}, votre loyer de ${formatFCFA(pmt.amount_fcfa as number)} pour ${propertyTitle} est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}. Merci de régulariser. Quittance : ${baseUrl}/api/quittance/${pmt.id}`
              )
              return (
                <div key={pmt.id as string} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tenant?.full_name ?? '—'}</p>
                    <p className="text-xs text-[#666] truncate">{propertyTitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-red-400">{formatFCFA(pmt.amount_fcfa as number)}</p>
                    <p className="text-xs text-[#555]">{daysLate}j de retard</p>
                  </div>
                  {tenant?.whatsapp ? (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/15 hover:bg-green-600/25 text-green-400 text-xs font-medium rounded-lg transition shrink-0"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Relancer
                    </a>
                  ) : (
                    <span className="text-xs text-[#444] w-24 text-right shrink-0">Pas de WhatsApp</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
