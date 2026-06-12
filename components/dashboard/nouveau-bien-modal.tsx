'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls =
  'bg-[#FAF9F5] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] w-full focus:outline-none focus:border-[#1F8A5B]/50'

export default function NouveauBienModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    transaction_type: 'location',
    property_type: 'appartement',
    price: '',
    city: 'Dakar',
    neighborhood: '',
    bedrooms: '',
    area_sqm: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function openModal() {
    setForm({ title: '', transaction_type: 'location', property_type: 'appartement', price: '', city: 'Dakar', neighborhood: '', bedrooms: '', area_sqm: '' })
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Le titre est requis.'); return }
    const price = parseInt(form.price, 10)
    if (!price || price <= 0) { setError('Le prix est requis.'); return }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Utilisateur non authentifié.'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()
      if (!profile?.agency_id) { setError('Aucune agence associée à ce compte.'); return }

      const { error: insertError } = await supabase.from('properties').insert({
        agency_id: profile.agency_id,
        title: form.title.trim(),
        transaction_type: form.transaction_type,
        property_type: form.property_type,
        price,
        city: form.city.trim() || 'Dakar',
        neighborhood: form.neighborhood.trim() || null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
        area_sqm: form.area_sqm ? parseInt(form.area_sqm, 10) : null,
        status: 'disponible',
      })
      if (insertError) { setError(insertError.message); return }

      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 text-white text-sm font-semibold rounded-xl transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter un bien
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          tabIndex={-1}
        >
          <div
            className="bg-white border border-[#181818]/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nouveau-bien-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="nouveau-bien-title" className="text-base font-semibold text-[#181818]">Nouveau bien</h3>
              <button onClick={() => setOpen(false)} className="text-[#91908C] hover:text-[#181818] transition" aria-label="Fermer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="bien-title" className="block text-sm text-[#62605B] mb-1.5">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input id="bien-title" type="text" name="title" value={form.title} onChange={handleChange}
                  placeholder="Ex: Appartement F3 — Plateau" className={inputCls} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bien-transaction" className="block text-sm text-[#62605B] mb-1.5">Transaction</label>
                  <select id="bien-transaction" name="transaction_type" value={form.transaction_type} onChange={handleChange} className={inputCls}>
                    <option value="location">Location</option>
                    <option value="vente">Vente</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bien-type" className="block text-sm text-[#62605B] mb-1.5">Type de bien</label>
                  <select id="bien-type" name="property_type" value={form.property_type} onChange={handleChange} className={inputCls}>
                    <option value="appartement">Appartement</option>
                    <option value="villa">Villa</option>
                    <option value="duplex">Duplex</option>
                    <option value="bureau">Bureau</option>
                    <option value="terrain">Terrain</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bien-price" className="block text-sm text-[#62605B] mb-1.5">
                  Prix (FCFA{form.transaction_type === 'location' ? '/mois' : ''}) <span className="text-red-500">*</span>
                </label>
                <input id="bien-price" type="number" name="price" value={form.price} onChange={handleChange}
                  placeholder={form.transaction_type === 'location' ? 'Ex: 350000' : 'Ex: 85000000'} className={inputCls} required min={1} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bien-city" className="block text-sm text-[#62605B] mb-1.5">Ville</label>
                  <input id="bien-city" type="text" name="city" value={form.city} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="bien-neighborhood" className="block text-sm text-[#62605B] mb-1.5">Quartier</label>
                  <input id="bien-neighborhood" type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                    placeholder="Ex: Mermoz" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bien-bedrooms" className="block text-sm text-[#62605B] mb-1.5">Chambres</label>
                  <input id="bien-bedrooms" type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange}
                    placeholder="Ex: 3" className={inputCls} min={0} />
                </div>
                <div>
                  <label htmlFor="bien-area" className="block text-sm text-[#62605B] mb-1.5">Surface (m²)</label>
                  <input id="bien-area" type="number" name="area_sqm" value={form.area_sqm} onChange={handleChange}
                    placeholder="Ex: 120" className={inputCls} min={0} />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="text-[#91908C] hover:text-[#181818] text-sm transition">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2.5 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition">
                  {loading ? 'Enregistrement...' : 'Créer le bien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
