import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import type { Tenant, Lease } from '@/lib/types'
import Link from 'next/link'
import NouveauLocataireModal from '@/components/dashboard/nouveau-locataire-modal'

const paymentStatusConfig = {
  paye: { label: 'Payé', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  en_attente: { label: 'En attente', className: 'text-orange-400 bg-orange-500/10' },
  retard: { label: 'Retard', className: 'text-red-400 bg-red-500/10' },
} as const

const filterOptions = [
  { value: 'tous', label: 'Tous' },
  { value: 'retard', label: 'En retard' },
  { value: 'actif', label: 'Actif' },
] as const

type FilterValue = 'tous' | 'retard' | 'actif'

export default async function LocatairesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const { filtre: rawFiltre = 'tous' } = await searchParams
  const filtre: FilterValue = ['tous', 'retard', 'actif'].includes(rawFiltre)
    ? (rawFiltre as FilterValue)
    : 'tous'

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

  let displayLeases = (leases as LeaseRow[]) ?? []
  if (filtre === 'retard') {
    displayLeases = displayLeases.filter((l) => lastPaymentStatus(l.id) === 'retard')
  } else if (filtre === 'actif') {
    displayLeases = displayLeases.filter((l) => lastPaymentStatus(l.id) !== 'retard')
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Locataires</h2>
          <p className="text-sm text-[#888]">{displayLeases.length} locataire{displayLeases.length !== 1 ? 's' : ''}</p>
        </div>
        <NouveauLocataireModal />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filterOptions.map((opt) => {
          const isActive = filtre === opt.value
          return (
            <Link
              key={opt.value}
              href={`/dashboard/locataires?filtre=${opt.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30'
                  : 'text-[#666] hover:text-white border border-white/[0.08] hover:border-white/20'
              }`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_130px_90px] gap-4 px-5 py-3 border-b border-white/[0.07] text-xs text-[#555] font-semibold uppercase tracking-wide">
          <span>Locataire</span>
          <span>Bien</span>
          <span>Loyer / mois</span>
          <span>Paiement</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {displayLeases.map((lease) => {
            const status = lastPaymentStatus(lease.id)
            const sc = paymentStatusConfig[status]
            return (
              <Link
                key={lease.id}
                href={`/dashboard/locataires/${lease.id}`}
                className="grid sm:grid-cols-[1fr_1fr_130px_90px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
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
                <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${sc.className}`}>{sc.label}</span>
              </Link>
            )
          })}
          {!displayLeases.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">Aucun locataire{filtre !== 'tous' ? ' pour ce filtre' : ' actif'}</p>
              <p className="text-xs text-[#444] mt-1">
                {filtre === 'tous'
                  ? 'Créez un contrat de location pour commencer'
                  : 'Modifiez le filtre pour voir tous les locataires'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
