import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import InspectionDoc from '@/components/pdf/inspection-doc'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select(`
      *,
      agency:agency_id(name, phone, city, country),
      property:property_id(id, title, neighborhood, city),
      lease:lease_id(
        tenant:tenant_id(full_name, phone)
      )
    `)
    .eq('id', id)
    .single()

  if (!inspection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  type AgencyJoined = { name: string; phone: string | null; city: string | null; country: string | null } | null
  type LeaseJoined = { tenant: { full_name: string; phone: string | null } | null } | null
  type PropertyJoined = { id: string; title: string; neighborhood: string | null; city: string } | null

  const agency = inspection.agency as AgencyJoined
  const lease = inspection.lease as LeaseJoined
  const property = inspection.property as PropertyJoined

  const props = {
    agency: {
      name: agency?.name ?? 'Agence Immobilière',
      city: agency?.city ?? null,
      country: agency?.country ?? null,
      phone: agency?.phone ?? null,
    },
    property: property
      ? {
          title: property.title,
          neighborhood: property.neighborhood ?? null,
          city: property.city,
        }
      : null,
    tenant: lease?.tenant
      ? {
          full_name: lease.tenant.full_name,
          phone: lease.tenant.phone ?? null,
        }
      : null,
    inspection: {
      id: String(inspection.id ?? ''),
      type: String(inspection.type ?? ''),
      inspection_date: String(inspection.inspection_date ?? ''),
      notes: inspection.notes ? String(inspection.notes) : null,
      photos: Array.isArray(inspection.photos) ? (inspection.photos as string[]) : [],
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buffer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(InspectionDoc, props) as any
    buffer = await renderToBuffer(element)
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="inspection-${id.slice(0, 8)}.pdf"`,
    },
  })
}
