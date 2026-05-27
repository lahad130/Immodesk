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
        agency:agency_id(name, phone, city, country)
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
    agency: { name: string; phone: string | null; city: string | null; country: string | null } | null
  }

  const lease = payment.lease as LeaseJoined

  const props = {
    agency: {
      name: lease.agency?.name ?? 'Agence Immobiliere',
      city: lease.agency?.city ?? null,
      country: lease.agency?.country ?? null,
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
      id: String(payment.id ?? ''),
      amount_fcfa: Number(payment.amount_fcfa ?? 0),
      due_date: String(payment.due_date ?? ''),
      paid_date: payment.paid_date ? String(payment.paid_date) : null,
      status: String(payment.status ?? 'en_attente'),
      payment_method: payment.payment_method ? String(payment.payment_method) : null,
    },
    lease: {
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: lease.monthly_rent,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buffer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(QuittanceDoc, props) as any
    buffer = await renderToBuffer(element)
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quittance-${paymentId.slice(0, 8)}.pdf"`,
    },
  })
}
