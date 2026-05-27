import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import BailDoc from '@/components/pdf/bail-doc'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('leases')
    .select(`
      id,
      start_date,
      end_date,
      monthly_rent,
      deposit,
      tenant:tenant_id(full_name, phone, email),
      property:property_id(title, neighborhood, city, property_type),
      agency:agency_id(name, city, country, phone, email)
    `)
    .eq('id', leaseId)
    .single()

  if (!raw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  type AgencyJoined = {
    name: string
    city: string | null
    country: string | null
    phone: string | null
    email: string | null
  } | null
  type TenantJoined = {
    full_name: string
    phone: string | null
    email: string | null
  } | null
  type PropertyJoined = {
    title: string
    neighborhood: string | null
    city: string
    property_type: string | null
  } | null

  const agency = raw.agency as unknown as AgencyJoined
  const tenant = raw.tenant as unknown as TenantJoined
  const property = raw.property as unknown as PropertyJoined

  if (!tenant) {
    return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 })
  }

  const props = {
    agency: {
      name: agency?.name ?? 'Agence Immobilière',
      city: agency?.city ?? null,
      country: agency?.country ?? null,
      phone: agency?.phone ?? null,
      email: agency?.email ?? null,
    },
    tenant: {
      full_name: tenant.full_name,
      phone: tenant.phone ?? null,
      email: tenant.email ?? null,
    },
    property: property
      ? {
          title: property.title,
          neighborhood: property.neighborhood ?? null,
          city: property.city,
          property_type: property.property_type ?? null,
        }
      : null,
    lease: {
      id: String(raw.id),
      start_date: String(raw.start_date),
      end_date: String(raw.end_date),
      monthly_rent: Number(raw.monthly_rent),
      deposit: Number(raw.deposit ?? 0),
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buffer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(BailDoc, props) as any
    buffer = await renderToBuffer(element)
  } catch (err) {
    console.error('Bail PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bail-${leaseId.slice(0, 8)}.pdf"`,
    },
  })
}
