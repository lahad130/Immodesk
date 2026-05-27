'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveIncident(incidentId: string) {
  const supabase = await createClient()
  await supabase
    .from('incidents')
    .update({ status: 'resolu' })
    .eq('id', incidentId)
  revalidatePath('/dashboard/locataires', 'layout')
}
