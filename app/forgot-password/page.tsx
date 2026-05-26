'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#171717] border border-white/10 rounded-xl p-8">
            <div className="w-12 h-12 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#3ECF8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Email envoyé</h2>
            <p className="text-[#888] text-sm">
              Un lien de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>.
            </p>
          </div>
          <p className="text-center mt-6 text-sm text-[#888]">
            <Link href="/login" className="text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-white">Immo<span className="text-[#3ECF8E]">Desk</span></span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-white">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-[#888]">Nous vous enverrons un lien de réinitialisation</p>
        </div>

        <div className="bg-[#171717] border border-white/10 rounded-xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#ccc] mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E] text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[#888]">
          <Link href="/login" className="text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
