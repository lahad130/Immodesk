import { createClient } from '@/lib/supabase/server'
import InspectionForm from '@/components/dashboard/inspection-form'
import type { LeaseOption } from '@/components/dashboard/inspection-form'
import Link from 'next/link'

export default async function NouvelleInspectionPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: leases }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, title, neighborhood, city')
      .order('title'),
    supabase
      .from('leases')
      .select(
        'id, start_date, end_date, tenant:tenant_id(full_name), property:property_id(title)',
      )
      .eq('status', 'actif')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/inspections"
        className="text-[#91908C] hover:text-[#181818] text-sm flex items-center gap-1.5 w-fit"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Inspections
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-[#181818]">Nouvel état des lieux</h2>
        <p className="text-sm text-[#62605B] mt-0.5">Remplissez le formulaire ci-dessous</p>
      </div>

      <InspectionForm
        properties={properties ?? []}
        leases={(leases as unknown as LeaseOption[]) ?? []}
      />
    </div>
  )
}
