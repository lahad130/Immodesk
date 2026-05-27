'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NouveauLocataireModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    email: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function openModal() {
    setForm({ full_name: '', phone: '', whatsapp: '', email: '' })
    setError(null)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Le nom complet est requis.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Utilisateur non authentifié.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!profile?.agency_id) {
        setError('Aucune agence associée à ce compte.')
        return
      }

      const { error: insertError } = await supabase.from('tenants').insert({
        agency_id: profile.agency_id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      closeModal()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Nouveau locataire
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          onKeyDown={(e) => { if (e.key === 'Escape') closeModal() }}
          tabIndex={-1}
        >
          <div
            className="bg-[#171717] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nouveau-locataire-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="nouveau-locataire-title" className="text-base font-semibold text-white">Nouveau locataire</h3>
              <button
                onClick={closeModal}
                className="text-[#666] hover:text-white transition"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tenant-full-name" className="block text-sm text-[#888] mb-1.5">
                  Nom complet <span className="text-red-400">*</span>
                </label>
                <input
                  id="tenant-full-name"
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Ex: Mamadou Diallo"
                  className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="tenant-phone" className="block text-sm text-[#888] mb-1.5">Téléphone</label>
                <input
                  id="tenant-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ex: +221 77 000 00 00"
                  className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="tenant-whatsapp" className="block text-sm text-[#888] mb-1.5">WhatsApp</label>
                <input
                  id="tenant-whatsapp"
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="Ex: +221 77 000 00 00"
                  className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="tenant-email" className="block text-sm text-[#888] mb-1.5">Email</label>
                <input
                  id="tenant-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Ex: mamadou@example.com"
                  className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-[#666] hover:text-white text-sm transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition"
                >
                  {loading ? 'Enregistrement...' : 'Créer le locataire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
