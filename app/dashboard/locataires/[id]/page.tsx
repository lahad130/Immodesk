import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/format'
import type { Tenant, Lease, Payment, Incident } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ResolveIncidentButton from '@/components/dashboard/resolve-incident-button'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const paymentStatusConfig = {
  paye: { label: 'Payé', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  en_attente: { label: 'En attente', className: 'text-orange-400 bg-orange-500/10' },
  retard: { label: 'Retard', className: 'text-red-400 bg-red-500/10' },
} as const

const leaseStatusConfig = {
  actif: { label: 'Actif', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  expire: { label: 'Expiré', className: 'text-orange-400 bg-orange-500/10' },
  resilie: { label: 'Résilié', className: 'text-red-400 bg-red-500/10' },
} as const

const incidentStatusConfig = {
  ouvert: { label: 'Ouvert', className: 'text-red-400 bg-red-500/10' },
  en_cours: { label: 'En cours', className: 'text-orange-400 bg-orange-500/10' },
  resolu: { label: 'Résolu', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
} as const

type LeaseDetail = Lease & {
  tenant: Tenant
  property: { id: string; title: string; neighborhood: string | null; city: string } | null
}

export default async function LocataireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: leaseRaw } = await supabase
    .from('leases')
    .select('*, tenant:tenant_id(*), property:property_id(id, title, neighborhood, city)')
    .eq('id', id)
    .single()

  if (!leaseRaw) {
    notFound()
  }

  const lease = leaseRaw as LeaseDetail

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('lease_id', id)
    .order('due_date', { ascending: false })

  const { data: incidents } = lease.property_id
    ? await supabase
        .from('incidents')
        .select('*')
        .eq('property_id', lease.property_id)
        .order('created_at', { ascending: false })
    : { data: [] as Incident[] }

  const tenant = lease.tenant
  const initials = (tenant.full_name ?? '??').slice(0, 2).toUpperCase()
  const whatsapp = (tenant.whatsapp ?? '').replace(/\D/g, '')

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back button */}
      <Link
        href="/dashboard/locataires"
        className="text-[#666] hover:text-white text-sm flex items-center gap-1.5 w-fit"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Locataires
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Payments section */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Historique des paiements</h3>
              <p className="text-xs text-[#666] mt-0.5">{(payments ?? []).length} paiement{(payments ?? []).length !== 1 ? 's' : ''}</p>
            </div>

            {(payments ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#555]">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      <th className="px-5 py-3 text-left text-xs text-[#555] font-semibold uppercase tracking-wide">Période</th>
                      <th className="px-5 py-3 text-left text-xs text-[#555] font-semibold uppercase tracking-wide">Montant</th>
                      <th className="px-5 py-3 text-left text-xs text-[#555] font-semibold uppercase tracking-wide">Statut</th>
                      <th className="px-5 py-3 text-left text-xs text-[#555] font-semibold uppercase tracking-wide">Quittance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {(payments as Payment[]).map((payment) => {
                      const sc = paymentStatusConfig[payment.status] ?? paymentStatusConfig.en_attente
                      return (
                        <tr key={payment.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-5 py-3.5 text-[#888]">
                            {formatDate(payment.due_date)}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-white">
                            {formatFCFA(payment.amount_fcfa)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.className}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <a
                                href={`/api/quittance/${payment.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                PDF
                              </a>
                              {tenant.whatsapp && (
                                <a
                                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Quittance disponible : ' + baseUrl + '/api/quittance/' + payment.id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-400 hover:text-green-300 text-xs underline"
                                >
                                  Envoyer
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incidents section */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Incidents</h3>
              <p className="text-xs text-[#666] mt-0.5">{(incidents ?? []).length} incident{(incidents ?? []).length !== 1 ? 's' : ''}</p>
            </div>

            {(incidents ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#555]">Aucun incident signalé</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {(incidents as Incident[]).map((incident) => {
                  const sc = incidentStatusConfig[incident.status] ?? incidentStatusConfig.ouvert
                  return (
                    <div key={incident.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{incident.title}</p>
                          {incident.description && (
                            <p className="text-xs text-[#666] mt-1 line-clamp-2">{incident.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {incident.status !== 'resolu' && (
                            <ResolveIncidentButton incidentId={incident.id} />
                          )}
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.className}`}>
                            {sc.label}
                          </span>
                          <span className="text-xs text-[#555]">{formatDate(incident.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Tenant info card */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{tenant.full_name}</h2>
                <p className="text-xs text-[#666] mt-0.5">Locataire</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {tenant.phone && (
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#555] shrink-0">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14h-.08z" />
                  </svg>
                  <span className="text-sm text-[#888]">{tenant.phone}</span>
                </div>
              )}

              {tenant.email && (
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#555] shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="text-sm text-[#888] truncate">{tenant.email}</span>
                </div>
              )}

              {tenant.whatsapp && (
                <div className="flex items-center gap-2.5 pt-1">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour ' + tenant.full_name + ',')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium rounded-lg transition"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lease card */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Contrat actif</h3>
              {(() => {
                const sc = leaseStatusConfig[lease.status] ?? leaseStatusConfig.expire
                return (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.className}`}>
                    {sc.label}
                  </span>
                )
              })()}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-0.5">Bien</p>
                <p className="text-sm text-white">{lease.property?.title ?? 'Non assigné'}</p>
                {lease.property?.neighborhood && (
                  <p className="text-xs text-[#666] mt-0.5">
                    {lease.property.neighborhood}, {lease.property.city}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-0.5">Période</p>
                <p className="text-sm text-[#888]">
                  {formatDate(lease.start_date)} — {formatDate(lease.end_date)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-0.5">Loyer mensuel</p>
                  <p className="text-sm font-semibold text-[#3ECF8E]">{formatFCFA(lease.monthly_rent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-0.5">Caution</p>
                  <p className="text-sm text-[#888]">{formatFCFA(lease.deposit)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
