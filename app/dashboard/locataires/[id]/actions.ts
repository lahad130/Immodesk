'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveIncident(incidentId: string, tenantId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('incidents')
    .update({ status: 'resolu' })
    .eq('id', incidentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/locataires/${tenantId}`)
}

export async function enregistrerPaiement(formData: FormData) {
  const supabase = await createClient()
  const leaseId = formData.get('lease_id') as string
  const tenantId = formData.get('tenant_id') as string
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
  revalidatePath(`/dashboard/locataires/${tenantId}`)
}

export async function creerBail(formData: FormData) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .single()

  if (!profile?.agency_id) throw new Error('Agence introuvable')

  const tenantId = formData.get('tenant_id') as string
  const propertyId = formData.get('property_id') as string || null
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const monthlyRent = parseInt(formData.get('monthly_rent') as string, 10)
  const rawDeposit = formData.get('deposit') as string
  const deposit = rawDeposit ? parseInt(rawDeposit, 10) : 0

  const { error } = await supabase.from('leases').insert({
    agency_id: profile.agency_id,
    tenant_id: tenantId,
    property_id: propertyId || null,
    start_date: startDate,
    end_date: endDate,
    monthly_rent: monthlyRent,
    deposit,
    status: 'actif',
  })

  if (error) throw new Error(error.message)

  // If property linked, update its status to 'loue'
  if (propertyId) {
    await supabase.from('properties').update({ status: 'loue' }).eq('id', propertyId)
  }

  revalidatePath(`/dashboard/locataires/${tenantId}`)
}
