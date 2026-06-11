import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'
import Topbar from '@/components/dashboard/topbar'

export const metadata = {
  title: 'Dashboard — ImmoDesk',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .maybeSingle()

  if (!profile?.agency_id) redirect('/onboarding')

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-[#f0f0f0] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
