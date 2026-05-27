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

export async function enregistrerPaiement(formData: FormData) {
  const supabase = await createClient()
  const leaseId = formData.get('lease_id') as string
  const amountFcfa = parseInt(formData.get('amount_fcfa') as string, 10)
  const dueDate = formData.get('due_date') as string
  const rawPaidDate = formData.get('paid_date') as string
  const paidDate = rawPaidDate || null
  const status = formData.get('status') as string
  const rawMethod = formData.get('payment_method') as string
  const paymentMethod = rawMethod || null

  const { error } = await supabase.from('payments').insert({
    lease_id: leaseId,
    amount_fcfa: amountFcfa,
    due_date: dueDate,
    paid_date: paidDate,
    status,
    payment_method: paymentMethod,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/locataires/${leaseId}`)
}
