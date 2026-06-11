import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/lib/types'

function formatFCFA(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Md FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

const statusConfig = {
  disponible: { label: 'Disponible', className: 'text-[#1F8A5B] bg-[#1F8A5B]/10' },
  reserve:    { label: 'Réservé',    className: 'text-orange-600 bg-orange-500/10' },
  vendu:      { label: 'Vendu',      className: 'text-blue-600 bg-blue-500/10' },
  loue:       { label: 'Loué',       className: 'text-purple-600 bg-purple-500/10' },
}

const typeIcons: Record<string, string> = {
  villa: '🏡',
  appartement: '🏢',
  bureau: '🏬',
  terrain: '🌳',
  duplex: '🏠',
}

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  const stats = {
    total: properties?.length ?? 0,
    disponible: properties?.filter((p) => p.status === 'disponible').length ?? 0,
    reserve: properties?.filter((p) => p.status === 'reserve').length ?? 0,
    vendu: properties?.filter((p) => p.status === 'vendu').length ?? 0,
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#181818]">Biens immobiliers</h2>
          <p className="text-sm text-[#62605B]">{stats.total} biens · {stats.disponible} disponibles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 text-white text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un bien
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#181818]' },
          { label: 'Disponibles', value: stats.disponible, color: 'text-[#1F8A5B]' },
          { label: 'Réservés', value: stats.reserve, color: 'text-orange-600' },
          { label: 'Vendus/Loués', value: stats.vendu, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#181818]/[0.08] rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#91908C] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid of property cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(properties as Property[])?.map((p) => {
          const sc = statusConfig[p.status] ?? statusConfig.disponible
          return (
            <div
              key={p.id}
              className="bg-white border border-[#181818]/[0.08] hover:border-[#181818]/[0.15] rounded-2xl overflow-hidden transition group cursor-pointer"
            >
              {/* Image placeholder */}
              <div className="h-36 bg-gradient-to-br from-[#1a1a1a] to-[#222] flex items-center justify-center text-4xl relative">
                {typeIcons[p.property_type ?? ''] ?? '🏠'}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.className}`}>
                    {sc.label}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white/90 capitalize">
                    {p.transaction_type}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold text-[#181818] leading-snug mb-1 line-clamp-1">{p.title}</p>
                <p className="text-xs text-[#91908C] mb-3">
                  {p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city}
                </p>

                <p className="text-base font-bold text-[#1F8A5B] mb-3">
                  {formatFCFA(p.price)}
                  {p.transaction_type === 'location' && <span className="text-xs font-normal text-[#91908C]">/mois</span>}
                </p>

                <div className="flex items-center gap-3 text-xs text-[#91908C]">
                  {p.area_sqm && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {p.area_sqm}m²
                    </span>
                  )}
                  {p.bedrooms != null && p.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {p.bedrooms} ch.
                    </span>
                  )}
                  <span className="capitalize text-[#B5B3AB]">{p.property_type}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
