import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import QuittanceDoc from '@/components/pdf/quittance-doc'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      lease:lease_id(
        *,
        tenant:tenant_id(*),
        property:property_id(id, title, neighborhood, city),
        agency:agency_id(name, phone)
      )
    `)
    .eq('id', paymentId)
    .single()

  if (!payment || !payment.lease) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  type LeaseJoined = {
    start_date: string
    end_date: string
    monthly_rent: number
    tenant: { full_name: string; phone: string | null; email: string | null } | null
    property: { title: string; neighborhood: string | null; city: string } | null
    agency: { name: string; phone: string | null } | null
  }

  const lease = payment.lease as LeaseJoined

  const props = {
    agency: {
      name: lease.agency?.name ?? 'Agence Immobiliere',
      address: null as string | null,
      phone: lease.agency?.phone ?? null,
    },
    tenant: {
      full_name: lease.tenant?.full_name ?? '—',
      phone: lease.tenant?.phone ?? null,
      email: lease.tenant?.email ?? null,
    },
    property: lease.property
      ? {
          title: lease.property.title,
          neighborhood: lease.property.neighborhood ?? null,
          city: lease.property.city,
        }
      : null,
    payment: {
      id: payment.id as string,
      amount_fcfa: payment.amount_fcfa as number,
      due_date: payment.due_date as string,
      paid_date: payment.paid_date as string | null,
      status: payment.status as string,
    },
    lease: {
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: lease.monthly_rent,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuittanceDoc, props) as any

  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quittance-${paymentId.slice(0, 8)}.pdf"`,
    },
  })
}
