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
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-[#181818]">Immo<span className="text-[#CC785C]">Desk</span></span>
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-semibold text-[#181818]">Bienvenue 👋</h1>
          <p className="mt-2 text-sm text-[#62605B]">
            Dernière étape : créez votre agence pour accéder à votre espace de gestion.
          </p>
        </div>

        <div className="bg-white border border-[#E6E4DA] rounded-2xl p-8">
          <OnboardingForm />
        </div>

        <p className="text-center mt-6 text-xs text-[#91908C]">
          Vous pourrez modifier ces informations plus tard. Elles apparaissent sur vos baux et quittances PDF.
        </p>
      </div>
    </div>
  )
}
