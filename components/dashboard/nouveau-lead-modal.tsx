'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls =
  'bg-[#FAF9F5] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] w-full focus:outline-none focus:border-[#1F8A5B]/50'

export default function NouveauLeadModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    status: 'nouveau',
    transaction_type: 'location',
    budget_max: '',
    source: 'appel_direct',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function openModal() {
    setForm({ full_name: '', phone: '', email: '', status: 'nouveau', transaction_type: 'location', budget_max: '', source: 'appel_direct', notes: '' })
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Le nom complet est requis.'); return }

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

      const { error: insertError } = await supabase.from('leads').insert({
        agency_id: profile.agency_id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        status: form.status,
        transaction_type: form.transaction_type,
        budget_max: form.budget_max ? parseInt(form.budget_max, 10) : null,
        source: form.source,
        notes: form.notes.trim() || null,
        last_contact_at: new Date().toISOString(),
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
        Nouveau lead
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
            aria-labelledby="nouveau-lead-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="nouveau-lead-title" className="text-base font-semibold text-[#181818]">Nouveau lead</h3>
              <button onClick={() => setOpen(false)} className="text-[#91908C] hover:text-[#181818] transition" aria-label="Fermer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="lead-name" className="block text-sm text-[#62605B] mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input id="lead-name" type="text" name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder="Ex: Fatou Sall" className={inputCls} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lead-phone" className="block text-sm text-[#62605B] mb-1.5">Téléphone</label>
                  <input id="lead-phone" type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+221 77 000 00 00" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="lead-email" className="block text-sm text-[#62605B] mb-1.5">Email</label>
                  <input id="lead-email" type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="fatou@exemple.com" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lead-status" className="block text-sm text-[#62605B] mb-1.5">Statut</label>
                  <select id="lead-status" name="status" value={form.status} onChange={handleChange} className={inputCls}>
                    <option value="nouveau">Nouveau</option>
                    <option value="chaud">Chaud</option>
                    <option value="tiede">Tiède</option>
                    <option value="froid">Froid</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="lead-transaction" className="block text-sm text-[#62605B] mb-1.5">Recherche</label>
                  <select id="lead-transaction" name="transaction_type" value={form.transaction_type} onChange={handleChange} className={inputCls}>
                    <option value="location">Location</option>
                    <option value="achat">Achat</option>
                    <option value="vente">Vente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lead-budget" className="block text-sm text-[#62605B] mb-1.5">Budget max (FCFA)</label>
                  <input id="lead-budget" type="number" name="budget_max" value={form.budget_max} onChange={handleChange}
                    placeholder="Ex: 500000" className={inputCls} min={0} />
                </div>
                <div>
                  <label htmlFor="lead-source" className="block text-sm text-[#62605B] mb-1.5">Source</label>
                  <select id="lead-source" name="source" value={form.source} onChange={handleChange} className={inputCls}>
                    <option value="appel_direct">Appel direct</option>
                    <option value="site_web">Site web</option>
                    <option value="reseaux_sociaux">Réseaux sociaux</option>
                    <option value="referral">Référence</option>
                    <option value="agence">Agence</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="lead-notes" className="block text-sm text-[#62605B] mb-1.5">Notes</label>
                <textarea id="lead-notes" name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Ex: Cherche un F3 à Mermoz, dispo le week-end" className={inputCls} />
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
                  {loading ? 'Enregistrement...' : 'Créer le lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
