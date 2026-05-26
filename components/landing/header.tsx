'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? ''

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#3ECF8E] flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Immo<span className="text-[#3ECF8E]">Desk</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-[#888] hover:text-white transition">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-[#888] hover:text-white transition">Tarifs</a>
            <a href="#about" className="text-sm text-[#888] hover:text-white transition">À propos</a>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-8 h-8 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] text-xs font-bold hover:bg-[#3ECF8E]/30 transition"
                >
                  {initials}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs text-[#888] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/logout"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#ccc] hover:text-white hover:bg-white/5 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex text-sm text-[#888] hover:text-white transition px-3 py-1.5"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black px-4 py-1.5 rounded-lg transition"
                >
                  Commencer
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 text-[#888] hover:text-white transition"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.08] py-4 space-y-1">
            <a href="#features" className="block px-2 py-2 text-sm text-[#888] hover:text-white transition" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#pricing" className="block px-2 py-2 text-sm text-[#888] hover:text-white transition" onClick={() => setMenuOpen(false)}>Tarifs</a>
            <a href="#about" className="block px-2 py-2 text-sm text-[#888] hover:text-white transition" onClick={() => setMenuOpen(false)}>À propos</a>
            {!user && (
              <Link href="/login" className="block px-2 py-2 text-sm text-[#888] hover:text-white transition" onClick={() => setMenuOpen(false)}>Connexion</Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
