import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import type { Tenant, Lease } from '@/lib/types'
import Link from 'next/link'

const paymentStatusConfig = {
  paye: { label: 'Payé', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  en_attente: { label: 'En attente', className: 'text-orange-400 bg-orange-500/10' },
  retard: { label: 'Retard', className: 'text-red-400 bg-red-500/10' },
} as const

export default async function LocatairesPage() {
  const supabase = await createClient()

  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      tenant:tenant_id(*),
      property:property_id(id, title, neighborhood, city)
    `)
    .eq('status', 'actif')
    .order('created_at', { ascending: false })

  const leaseIds = (leases ?? []).map((l) => l.id)
  const { data: lastPayments } = leaseIds.length
    ? await supabase
        .from('payments')
        .select('lease_id, status, due_date')
        .in('lease_id', leaseIds)
        .order('due_date', { ascending: false })
    : { data: [] }

  function lastPaymentStatus(leaseId: string): keyof typeof paymentStatusConfig {
    const p = (lastPayments ?? []).find((x) => x.lease_id === leaseId)
    return (p?.status as keyof typeof paymentStatusConfig) ?? 'en_attente'
  }

  type LeaseRow = Lease & {
    tenant: Tenant
    property: { id: string; title: string; neighborhood: string | null; city: string } | null
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Locataires</h2>
          <p className="text-sm text-[#888]">{leases?.length ?? 0} contrats actifs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau locataire
        </button>
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.07] text-xs text-[#555] font-semibold uppercase tracking-wide">
          <span>Locataire</span>
          <span>Bien</span>
          <span>Loyer / mois</span>
          <span>Fin contrat</span>
          <span>Paiement</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(leases as LeaseRow[] ?? []).map((lease) => {
            const status = lastPaymentStatus(lease.id)
            const sc = paymentStatusConfig[status]
            return (
              <Link
                key={lease.id}
                href={`/dashboard/locataires/${lease.id}`}
                className="grid sm:grid-cols-[1fr_1fr_120px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {lease.tenant.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lease.tenant.full_name}</p>
                    <p className="text-xs text-[#666] truncate">{lease.tenant.phone ?? '—'}</p>
                  </div>
                </div>
                <p className="text-sm text-[#888] truncate">
                  {lease.property?.title ?? <span className="text-[#555]">Non assigné</span>}
                </p>
                <p className="text-sm font-semibold text-[#3ECF8E]">{formatFCFA(lease.monthly_rent)}</p>
                <p className="text-xs text-[#666]">
                  {new Date(lease.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${sc.className}`}>{sc.label}</span>
              </Link>
            )
          })}
          {!leases?.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">Aucun locataire actif</p>
              <p className="text-xs text-[#444] mt-1">Créez un contrat de location pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
