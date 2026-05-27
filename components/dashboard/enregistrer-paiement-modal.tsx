'use client'

import { useState, useTransition, useRef } from 'react'
import { enregistrerPaiement } from '@/app/dashboard/locataires/[id]/actions'

const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
]

export default function EnregistrerPaiementModal({
  leaseId,
  monthlyRent,
}: {
  leaseId: string
  monthlyRent: number
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await enregistrerPaiement(formData)
        setOpen(false)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-xs font-semibold rounded-lg transition"
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Enregistrer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pmt-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        >
          <div className="bg-[#161616] border border-white/[0.09] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 id="pmt-modal-title" className="text-sm font-semibold text-white">Enregistrer un paiement</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[#555] hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="hidden" name="lease_id" value={leaseId} />

              <div>
                <label htmlFor="pmt-due-date" className="block text-xs text-[#666] mb-1.5">Période (date d&apos;échéance)</label>
                <input
                  id="pmt-due-date"
                  name="due_date"
                  type="date"
                  defaultValue={firstOfMonth}
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-amount" className="block text-xs text-[#666] mb-1.5">Montant (FCFA)</label>
                <input
                  id="pmt-amount"
                  name="amount_fcfa"
                  type="number"
                  defaultValue={monthlyRent}
                  min={1}
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-status" className="block text-xs text-[#666] mb-1.5">Statut</label>
                <select
                  id="pmt-status"
                  name="status"
                  defaultValue="paye"
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                >
                  <option value="paye">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="retard">Retard</option>
                </select>
              </div>

              <div>
                <label htmlFor="pmt-paid-date" className="block text-xs text-[#666] mb-1.5">Date de paiement (si payé)</label>
                <input
                  id="pmt-paid-date"
                  name="paid_date"
                  type="date"
                  defaultValue={today}
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-method" className="block text-xs text-[#666] mb-1.5">Moyen de paiement</label>
                <select
                  id="pmt-method"
                  name="payment_method"
                  defaultValue="especes"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                >
                  <option value="">Non précisé</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-[#666] hover:text-white border border-white/[0.08] rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  className="flex-1 px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition"
                >
                  {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
