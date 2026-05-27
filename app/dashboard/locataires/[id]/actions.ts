'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveIncident(incidentId: string, leaseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('incidents')
    .update({ status: 'resolu' })
    .eq('id', incidentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/locataires/${leaseId}`)
}
