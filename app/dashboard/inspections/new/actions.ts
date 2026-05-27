'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInspection(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) throw new Error('Aucune agence')

  const propertyId = formData.get('property_id') as string | null
  const leaseId = formData.get('lease_id') as string | null
  const type = formData.get('type') as string
  const inspectionDate = formData.get('inspection_date') as string
  const notes = formData.get('notes') as string | null
  // Photos are passed as JSON array of URLs (already uploaded to Supabase Storage)
  const photosJson = formData.get('photos') as string | null
  const photos: string[] = photosJson ? JSON.parse(photosJson) : []

  if (!type || !inspectionDate) throw new Error('Champs obligatoires manquants')

  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      agency_id: profile.agency_id,
      property_id: propertyId || null,
      lease_id: leaseId || null,
      type,
      inspection_date: inspectionDate,
      notes: notes?.trim() || null,
      photos,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/inspections')
  redirect(`/dashboard/inspections/${inspection.id}`)
}
