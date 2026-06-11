'use client'

import { useState, useTransition } from 'react'
import { deleteDocument } from '@/app/dashboard/documents/actions'

export default function DeleteDocumentButton({
  documentId,
  storagePath,
}: {
  documentId: string
  storagePath: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('Supprimer ce document définitivement ?')) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteDocument(documentId, storagePath)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Supprimer"
        aria-busy={isPending}
        className="p-1.5 text-[#A09E96] hover:text-red-600 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">{error}</span>
      )}
    </>
  )
}
