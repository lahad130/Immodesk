import { createClient } from '@/lib/supabase/server'
import type { Inspection } from '@/lib/types'
import { formatDate } from '@/lib/format'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type InspectionDetail = Inspection & {
  property: { id: string; title: string; neighborhood: string | null; city: string } | null
  lease: {
    id: string
    tenant: { full_name: string; phone: string | null; whatsapp: string | null } | null
    agency: { name: string; phone: string | null; city: string | null; country: string | null } | null
  } | null
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('inspections')
    .select(`
      *,
      property:property_id(id, title, neighborhood, city),
      lease:lease_id(
        id,
        tenant:tenant_id(full_name, phone, whatsapp),
        agency:agency_id(name, phone, city, country)
      )
    `)
    .eq('id', id)
    .single()

  if (!raw) {
    notFound()
  }

  const inspection = raw as InspectionDetail
  const tenant = inspection.lease?.tenant ?? null
  const photos: string[] = Array.isArray(inspection.photos) ? inspection.photos : []
  const whatsapp = (tenant?.whatsapp ?? '').replace(/\D/g, '')
  const waMessage = encodeURIComponent(
    `Rapport état des lieux disponible ici : ${baseUrl}/api/inspection-report/${inspection.id}`
  )

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back button */}
      <Link
        href="/dashboard/inspections"
        className="text-[#666] hover:text-white text-sm flex items-center gap-1.5 w-fit"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Inspections
      </Link>

      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold text-white">
          Etat des lieux — {inspection.property?.title ?? 'Bien non assigné'}
        </h2>
        <p className="text-sm text-[#666] mt-0.5">
          {formatDate(inspection.inspection_date, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Photos section */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Photos</h3>
              <p className="text-xs text-[#666] mt-0.5">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-5">
              {photos.length === 0 ? (
                <div className="py-10 text-center">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#444] mx-auto mb-3">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p className="text-sm text-[#555]">Aucune photo enregistrée</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-xl hover:opacity-90 transition"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Observations</h3>
            </div>
            <div className="px-5 py-5">
              {inspection.notes ? (
                <p className="text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">
                  {inspection.notes}
                </p>
              ) : (
                <p className="text-sm text-[#555]">Aucune observation enregistrée</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Info card */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Informations</h3>

            {/* Type badge */}
            <div>
              <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-1.5">Type</p>
              {inspection.type === 'entree' ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-[#3ECF8E] bg-[#3ECF8E]/10">
                  Entrée
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-orange-400 bg-orange-500/10">
                  Sortie
                </span>
              )}
            </div>

            {/* Date */}
            <div>
              <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-1">Date</p>
              <p className="text-sm text-[#888]">
                {formatDate(inspection.inspection_date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Bien */}
            <div>
              <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-1">Bien</p>
              {inspection.property ? (
                <>
                  <p className="text-sm text-white">{inspection.property.title}</p>
                  {(inspection.property.neighborhood || inspection.property.city) && (
                    <p className="text-xs text-[#666] mt-0.5">
                      {[inspection.property.neighborhood, inspection.property.city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#555]">Non assigné</p>
              )}
            </div>

            {/* Locataire */}
            <div>
              <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-1">Locataire</p>
              {tenant ? (
                <>
                  <p className="text-sm text-white">{tenant.full_name}</p>
                  {tenant.phone && (
                    <p className="text-xs text-[#666] mt-0.5">{tenant.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#555]">Non renseigné</p>
              )}
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Actions</h3>

            {/* PDF button */}
            <a
              href={`/api/inspection-report/${inspection.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white text-sm font-medium rounded-xl transition border border-white/[0.08]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Rapport PDF
            </a>

            {/* WhatsApp button — only if tenant has whatsapp */}
            {tenant?.whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-green-500/5 hover:bg-green-500/10 text-green-400 text-sm font-medium rounded-xl transition border border-green-500/20"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Envoyer par WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
