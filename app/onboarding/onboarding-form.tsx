'use client'

import { useState, useTransition } from 'react'
import { createAgency } from './actions'

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createAgency(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="agency-name" className="block text-sm text-[#888] mb-1.5">
          Nom de l&apos;agence <span className="text-red-400">*</span>
        </label>
        <input
          id="agency-name"
          type="text"
          name="name"
          placeholder="Ex: Teranga Immo"
          className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="agency-phone" className="block text-sm text-[#888] mb-1.5">Téléphone</label>
        <input
          id="agency-phone"
          type="tel"
          name="phone"
          placeholder="Ex: +221 77 000 00 00"
          className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
        />
      </div>

      <div>
        <label htmlFor="agency-city" className="block text-sm text-[#888] mb-1.5">Ville</label>
        <input
          id="agency-city"
          type="text"
          name="city"
          placeholder="Ex: Dakar"
          defaultValue="Dakar"
          className="bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 px-4 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition"
      >
        {pending ? 'Création en cours...' : 'Créer mon agence'}
      </button>
    </form>
  )
}
