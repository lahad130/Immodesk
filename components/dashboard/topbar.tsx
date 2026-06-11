'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/leads': 'Leads',
  '/dashboard/properties': 'Biens',
  '/dashboard/visits': 'Visites',
  '/dashboard/ai-agent': 'Agent IA',
  '/dashboard/documents': 'Documents',
}

export default function Topbar() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const initials = email?.slice(0, 2).toUpperCase() ?? '??'
  const title = breadcrumbs[pathname] ?? 'Dashboard'

  return (
    <header className="h-14 border-b border-[#181818]/[0.08] bg-[#F5F4EE]/80 backdrop-blur flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#1F8A5B] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
          </svg>
        </div>
        <span className="text-sm font-bold text-[#181818]">Immo<span className="text-[#1F8A5B]">Desk</span></span>
      </div>

      <h1 className="hidden lg:block text-sm font-semibold text-[#181818]">{title}</h1>

      <div className="flex-1" />

      {/* Notif + avatar */}
      <button className="relative p-1.5 text-[#91908C] hover:text-[#181818] transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#1F8A5B]" />
      </button>

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#1F8A5B]/20 border border-[#1F8A5B]/30 flex items-center justify-center text-[#1F8A5B] text-xs font-bold">
          {initials}
        </div>
        <span className="hidden sm:block text-xs text-[#62605B] max-w-[140px] truncate">{email}</span>
      </div>

      {/* Mobile hamburger — opens bottom sheet nav */}
      <button
        className="lg:hidden p-1.5 text-[#91908C] hover:text-[#181818]"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <nav className="relative ml-auto w-64 bg-[#FAF9F5] h-full flex flex-col p-4 gap-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#181818]">Navigation</span>
              <button onClick={() => setMobileNavOpen(false)} className="text-[#91908C] hover:text-[#181818]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {[
              { href: '/dashboard', label: 'Tableau de bord' },
              { href: '/dashboard/leads', label: 'Leads' },
              { href: '/dashboard/properties', label: 'Biens' },
              { href: '/dashboard/visits', label: 'Visites' },
              { href: '/dashboard/ai-agent', label: 'Agent IA' },
              { href: '/dashboard/documents', label: 'Documents' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm transition ${
                  pathname === item.href
                    ? 'bg-[#1F8A5B]/10 text-[#1F8A5B]'
                    : 'text-[#62605B] hover:text-[#181818] hover:bg-[#181818]/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-auto pt-4 border-t border-[#181818]/10">
              <Link href="/logout" className="px-3 py-2.5 rounded-lg text-sm text-[#91908C] hover:text-[#181818] hover:bg-[#181818]/5 block">
                Déconnexion
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
