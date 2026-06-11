'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

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
          <h1 className="mt-6 font-serif text-2xl font-semibold text-[#181818]">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-[#62605B]">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <div className="bg-white border border-[#E6E4DA] rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#3D3D3A] mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6 caractères minimum"
                className="w-full px-3 py-2.5 bg-white border border-[#D9D7CC] rounded-lg text-[#181818] placeholder-[#A8A69E] focus:outline-none focus:ring-2 focus:ring-[#CC785C]/30 focus:border-[#CC785C] text-sm transition"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[#3D3D3A] mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Répétez le mot de passe"
                className="w-full px-3 py-2.5 bg-white border border-[#D9D7CC] rounded-lg text-[#181818] placeholder-[#A8A69E] focus:outline-none focus:ring-2 focus:ring-[#CC785C]/30 focus:border-[#CC785C] text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#181818] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full text-sm transition"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
