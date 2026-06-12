'use client'

import { useState, useTransition, useRef } from 'react'
import { creerBail } from '@/app/dashboard/locataires/[id]/actions'

type Property = { id: string; title: string; neighborhood: string | null; city: string }

export default function NouveauBailModal({
  tenantId,
  tenantName,
  properties,
}: {
  tenantId: string
  tenantName: string
  properties: Property[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const oneYearLater = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await creerBail(formData)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 text-white text-sm font-semibold rounded-xl transition"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Créer un bail
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bail-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        >
          <div className="bg-[#F0EEE6] border border-[#181818]/[0.10] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#181818]/[0.08]">
              <div>
                <h3 id="bail-modal-title" className="text-sm font-semibold text-[#181818]">Nouveau bail</h3>
                <p className="text-xs text-[#A09E96] mt-0.5">{tenantName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[#A09E96] hover:text-[#181818] transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="hidden" name="tenant_id" value={tenantId} />

              <div>
                <label htmlFor="bail-property" className="block text-xs text-[#91908C] mb-1.5">Bien (optionnel)</label>
                <select
                  id="bail-property"
                  name="property_id"
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                >
                  <option value="">Aucun bien assigné</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}{p.neighborhood ? ` — ${p.neighborhood}` : ''}, {p.city}
                    </option>
                  ))}
                </select>
                {properties.length === 0 && (
                  <p className="text-xs text-[#A09E96] mt-1">Aucun bien disponible</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bail-start" className="block text-xs text-[#91908C] mb-1.5">Début du bail</label>
                  <input
                    id="bail-start"
                    name="start_date"
                    type="date"
                    defaultValue={today}
                    required
                    aria-required="true"
                    className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                  />
                </div>
                <div>
                  <label htmlFor="bail-end" className="block text-xs text-[#91908C] mb-1.5">Fin du bail</label>
                  <input
                    id="bail-end"
                    name="end_date"
                    type="date"
                    defaultValue={oneYearLater}
                    required
                    aria-required="true"
                    className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bail-rent" className="block text-xs text-[#91908C] mb-1.5">Loyer mensuel (FCFA)</label>
                <input
                  id="bail-rent"
                  name="monthly_rent"
                  type="number"
                  min={1}
                  placeholder="150000"
                  required
                  aria-required="true"
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] placeholder-[#B5B3AB] focus:outline-none focus:border-[#1F8A5B]/50"
                />
              </div>

              <div>
                <label htmlFor="bail-deposit" className="block text-xs text-[#91908C] mb-1.5">Caution (FCFA)</label>
                <input
                  id="bail-deposit"
                  name="deposit"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-[#91908C] hover:text-[#181818] border border-[#181818]/[0.08] rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  className="flex-1 px-4 py-2.5 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                >
                  {isPending ? 'Création...' : 'Créer le bail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
