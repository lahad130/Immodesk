'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-[#181818]">Immo<span className="text-[#CC785C]">Desk</span></span>
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-semibold text-[#181818]">Connexion</h1>
          <p className="mt-2 text-sm text-[#62605B]">Accédez à votre espace de travail</p>
        </div>

        <div className="bg-white border border-[#E6E4DA] rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#3D3D3A] mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full px-3 py-2.5 bg-white border border-[#D9D7CC] rounded-lg text-[#181818] placeholder-[#A8A69E] focus:outline-none focus:ring-2 focus:ring-[#CC785C]/30 focus:border-[#CC785C] text-sm transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#3D3D3A]">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-xs text-[#CC785C] hover:text-[#B8633F] transition">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white border border-[#D9D7CC] rounded-lg text-[#181818] placeholder-[#A8A69E] focus:outline-none focus:ring-2 focus:ring-[#CC785C]/30 focus:border-[#CC785C] text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#181818] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full text-sm transition"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-[#62605B]">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-[#CC785C] hover:text-[#B8633F] transition">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
