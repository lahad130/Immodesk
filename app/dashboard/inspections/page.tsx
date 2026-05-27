import { createClient } from '@/lib/supabase/server'
import type { Inspection } from '@/lib/types'
import Link from 'next/link'

type InspectionRow = Inspection & {
  property: { id: string; title: string; neighborhood: string | null; city: string } | null
  lease: {
    id: string
    tenant: { full_name: string } | null
  } | null
}

export default async function InspectionsPage() {
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(`
      *,
      property:property_id(id, title, neighborhood, city),
      lease:lease_id(
        id,
        tenant:tenant_id(full_name)
      )
    `)
    .order('inspection_date', { ascending: false })

  const displayInspections = (inspections as InspectionRow[]) ?? []

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Inspections</h2>
          <p className="text-sm text-[#888]">
            {displayInspections.length} état{displayInspections.length !== 1 ? 's' : ''} des lieux
          </p>
        </div>
        <Link
          href="/dashboard/inspections/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvel état des lieux
        </Link>
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[110px_1fr_1fr_90px_70px_80px] gap-4 px-5 py-3 border-b border-white/[0.07] text-xs text-[#555] font-semibold uppercase tracking-wide">
          <span>Date</span>
          <span>Bien</span>
          <span>Locataire</span>
          <span>Type</span>
          <span>Photos</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {displayInspections.map((inspection) => (
            <Link
              key={inspection.id}
              href={`/dashboard/inspections/${inspection.id}`}
              className="grid sm:grid-cols-[110px_1fr_1fr_90px_70px_80px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
            >
              {/* Date */}
              <p className="text-sm text-[#888]">
                {new Date(inspection.inspection_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })}
              </p>

              {/* Bien */}
              <p className="text-sm text-white truncate">
                {inspection.property?.title ?? (
                  <span className="text-[#555]">Non assigné</span>
                )}
              </p>

              {/* Locataire */}
              <p className="text-sm text-[#888] truncate">
                {inspection.lease?.tenant?.full_name ?? '—'}
              </p>

              {/* Type badge */}
              {inspection.type === 'entree' ? (
                <span className="text-xs font-semibold px-2 py-1 rounded-full text-[#3ECF8E] bg-[#3ECF8E]/10 w-fit">
                  Entrée
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 rounded-full text-orange-400 bg-orange-500/10 w-fit">
                  Sortie
                </span>
              )}

              {/* Photos count */}
              <p className="text-sm text-[#666]">
                {inspection.photos?.length ?? 0} photo{(inspection.photos?.length ?? 0) !== 1 ? 's' : ''}
              </p>

              {/* View link */}
              <span className="text-xs text-[#3ECF8E] hover:text-[#3ECF8E]/80">
                Voir →
              </span>
            </Link>
          ))}
          {!displayInspections.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">Aucun état des lieux enregistré</p>
              <p className="text-xs text-[#444] mt-1">Créez votre premier état des lieux</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
