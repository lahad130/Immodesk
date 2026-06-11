import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './onboarding-form'

export const metadata = {
  title: 'Créez votre agence',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .maybeSingle()

  if (profile?.agency_id) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-white">Immo<span className="text-[#3ECF8E]">Desk</span></span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-white">Bienvenue 👋</h1>
          <p className="mt-2 text-sm text-[#888]">
            Dernière étape : créez votre agence pour accéder à votre espace de gestion.
          </p>
        </div>

        <div className="bg-[#171717] border border-white/10 rounded-xl p-8">
          <OnboardingForm />
        </div>

        <p className="text-center mt-6 text-xs text-[#666]">
          Vous pourrez modifier ces informations plus tard. Elles apparaissent sur vos baux et quittances PDF.
        </p>
      </div>
    </div>
  )
}
