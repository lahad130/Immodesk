'use client'

import { useTransition } from 'react'
import { resolveIncident } from '@/app/dashboard/locataires/[id]/actions'

export default function ResolveIncidentButton({ incidentId }: { incidentId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => resolveIncident(incidentId))}
      disabled={pending}
      className="text-xs text-[#555] hover:text-white border border-white/[0.08] hover:border-white/20 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
    >
      {pending ? '...' : 'Résolu'}
    </button>
  )
}
