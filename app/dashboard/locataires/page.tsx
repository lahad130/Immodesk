import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
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

type TenantRow = {
  id: string
  full_name: string
  phone: string | null
  lease: {
    id: string
    monthly_rent: number
    property: { title: string } | null
    lastPaymentStatus: keyof typeof paymentStatusConfig | null
  } | null
}

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

  // Fetch all tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, full_name, phone')
    .order('full_name')

  // Fetch active leases with property info
  const { data: leases } = await supabase
    .from('leases')
    .select('id, tenant_id, monthly_rent, property:property_id(title)')
    .eq('status', 'actif')

  // Fetch last payment per lease
  const leaseIds = (leases ?? []).map((l) => l.id)
  const { data: lastPayments } = leaseIds.length
    ? await supabase
        .from('payments')
        .select('lease_id, status, due_date')
        .in('lease_id', leaseIds)
        // Ordered DESC so first occurrence per lease_id is the most-recent payment
        .order('due_date', { ascending: false })
    : { data: [] }

  // Build a map: tenant_id → lease + last payment status
  const leaseByTenant = new Map<string, TenantRow['lease']>()
  for (const lease of leases ?? []) {
    if (!lease.tenant_id) continue
    const lastPmt = (lastPayments ?? []).find((p) => p.lease_id === lease.id)
    const status = (lastPmt?.status ?? null) as keyof typeof paymentStatusConfig | null
    leaseByTenant.set(lease.tenant_id, {
      id: lease.id,
      monthly_rent: lease.monthly_rent as number,
      property: (lease.property as unknown as { title: string } | null),
      lastPaymentStatus: status,
    })
  }

  // Build display rows
  let rows: TenantRow[] = (tenants ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    phone: t.phone,
    lease: leaseByTenant.get(t.id) ?? null,
  }))

  // Apply filter (only affects tenants with a lease)
  if (filtre === 'retard') {
    rows = rows.filter((r) => r.lease?.lastPaymentStatus === 'retard')
  } else if (filtre === 'actif') {
    rows = rows.filter((r) => r.lease && r.lease.lastPaymentStatus !== 'retard')
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Locataires</h2>
          <p className="text-sm text-[#888]">{rows.length} locataire{rows.length !== 1 ? 's' : ''}</p>
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
          {rows.map((row) => {
            const sc = row.lease?.lastPaymentStatus
              ? paymentStatusConfig[row.lease.lastPaymentStatus]
              : null
            const inner = (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {row.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.full_name}</p>
                    <p className="text-xs text-[#666] truncate">{row.phone ?? '—'}</p>
                  </div>
                </div>
                <p className="text-sm text-[#888] truncate">
                  {row.lease?.property?.title ?? <span className="text-[#444]">Aucun bail</span>}
                </p>
                <p className="text-sm font-semibold text-[#3ECF8E]">
                  {row.lease ? formatFCFA(row.lease.monthly_rent) : <span className="text-[#444]">—</span>}
                </p>
                {sc ? (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${sc.className}`}>
                    {sc.label}
                  </span>
                ) : (
                  <span className="text-xs text-[#444]">—</span>
                )}
              </>
            )

            return (
              <Link
                key={row.id}
                href={`/dashboard/locataires/${row.id}`}
                className="grid sm:grid-cols-[1fr_1fr_130px_90px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
              >
                {inner}
              </Link>
            )
          })}
          {!rows.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">
                {filtre !== 'tous' ? 'Aucun locataire pour ce filtre' : 'Aucun locataire enregistré'}
              </p>
              <p className="text-xs text-[#444] mt-1">
                {filtre === 'tous'
                  ? 'Créez votre premier locataire'
                  : 'Modifiez le filtre pour voir tous les locataires'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
