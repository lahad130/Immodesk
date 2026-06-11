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
        <label htmlFor="agency-name" className="block text-sm text-[#62605B] mb-1.5">
          Nom de l&apos;agence <span className="text-red-400">*</span>
        </label>
        <input
          id="agency-name"
          type="text"
          name="name"
          placeholder="Ex: Teranga Immo"
          className="bg-white border border-[#D9D7CC] rounded-xl px-3 py-2.5 text-sm text-[#181818] w-full focus:outline-none focus:border-[#CC785C]"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="agency-phone" className="block text-sm text-[#62605B] mb-1.5">Téléphone</label>
        <input
          id="agency-phone"
          type="tel"
          name="phone"
          placeholder="Ex: +221 77 000 00 00"
          className="bg-white border border-[#D9D7CC] rounded-xl px-3 py-2.5 text-sm text-[#181818] w-full focus:outline-none focus:border-[#CC785C]"
        />
      </div>

      <div>
        <label htmlFor="agency-city" className="block text-sm text-[#62605B] mb-1.5">Ville</label>
        <input
          id="agency-city"
          type="text"
          name="city"
          placeholder="Ex: Dakar"
          defaultValue="Dakar"
          className="bg-white border border-[#D9D7CC] rounded-xl px-3 py-2.5 text-sm text-[#181818] w-full focus:outline-none focus:border-[#CC785C]"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 px-4 bg-[#181818] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full text-sm transition"
      >
        {pending ? 'Création en cours...' : 'Créer mon agence'}
      </button>
    </form>
  )
}
