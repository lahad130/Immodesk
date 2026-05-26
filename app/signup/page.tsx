'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Email confirmation disabled → session immediately active
    if (data.session) {
      router.push('/dashboard')
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
            <h2 className="text-xl font-semibold text-white mb-2">Vérifiez votre email</h2>
            <p className="text-[#888] text-sm">
              Un lien de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
          </div>
          <p className="text-center mt-6 text-sm text-[#888]">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
              Se connecter
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
          <h1 className="mt-6 text-2xl font-semibold text-white">Créer un compte</h1>
          <p className="mt-2 text-sm text-[#888]">Démarrez gratuitement, sans carte bancaire</p>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#ccc] mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6 caractères minimum"
                className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-white/10 rounded-lg text-white placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E] text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte gratuitement'}
            </button>
          </form>

          <p className="mt-4 text-xs text-[#666] text-center">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="text-[#3ECF8E]/70 hover:text-[#3ECF8E]">conditions d&apos;utilisation</a>.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-[#888]">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
