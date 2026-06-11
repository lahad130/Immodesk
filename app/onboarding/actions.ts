'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createAgency(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  const name = ((formData.get('name') as string) || '').trim()
  if (!name) return { error: "Le nom de l'agence est requis." }

  const phone = ((formData.get('phone') as string) || '').trim() || null
  const city = ((formData.get('city') as string) || '').trim() || 'Dakar'

  const { error } = await supabase.rpc('create_agency_for_current_user', {
    p_name: name,
    p_phone: phone,
    p_city: city,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}
