'use client'

import { useTransition, useState } from 'react'
import { resolveIncident } from '@/app/dashboard/locataires/[id]/actions'

export default function ResolveIncidentButton({
  incidentId,
  tenantId,
}: {
  incidentId: string
  tenantId: string
}) {
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          try {
            await resolveIncident(incidentId, tenantId)
          } catch {
            setFailed(true)
          }
        })
      }
      disabled={pending}
      aria-label={pending ? 'Résolution en cours' : 'Marquer comme résolu'}
      aria-busy={pending}
      className={`text-xs border px-2.5 py-1 rounded-lg transition disabled:opacity-50 ${
        failed
          ? 'text-red-600 border-red-500/20'
          : 'text-[#A09E96] hover:text-[#181818] border-[#181818]/[0.08] hover:border-[#181818]/20'
      }`}
    >
      {pending ? '...' : failed ? 'Erreur' : 'Résolu'}
    </button>
  )
}
