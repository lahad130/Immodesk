'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'contrat', label: 'Contrat' },
  { value: 'titre', label: 'Titre foncier' },
  { value: 'mandat', label: 'Mandat' },
  { value: 'bail', label: 'Bail' },
  { value: 'quittance', label: 'Quittance' },
  { value: 'etat_des_lieux', label: 'État des lieux' },
  { value: 'autres', label: 'Autres' },
]

export default function UploadDocumentModal({ agencyId }: { agencyId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    const file = formData.get('file') as File
    const rawName = (formData.get('name') as string).trim()
    const name = rawName || file.name
    const category = formData.get('category') as string

    if (!file || file.size === 0) {
      setError('Sélectionnez un fichier.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${agencyId}/${crypto.randomUUID()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })

      if (storageError) throw new Error(storageError.message)

      const { error: dbError } = await supabase.from('documents').insert({
        agency_id: agencyId,
        name,
        category,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type,
      })

      if (dbError) {
        await supabase.storage.from('documents').remove([path])
        throw new Error(dbError.message)
      }

      setOpen(false)
      formRef.current?.reset()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 text-white text-sm font-semibold rounded-xl transition"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Importer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        >
          <div className="bg-[#F0EEE6] border border-[#181818]/[0.10] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#181818]/[0.08]">
              <h3 id="upload-modal-title" className="text-sm font-semibold text-[#181818]">Importer un document</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[#A09E96] hover:text-[#181818] transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="doc-file" className="block text-xs text-[#91908C] mb-1.5">Fichier</label>
                <input
                  id="doc-file"
                  name="file"
                  type="file"
                  required
                  aria-required="true"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#62605B] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#181818]/10 file:text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                />
              </div>

              <div>
                <label htmlFor="doc-name" className="block text-xs text-[#91908C] mb-1.5">Nom du document (optionnel)</label>
                <input
                  id="doc-name"
                  name="name"
                  type="text"
                  placeholder="Laissez vide pour utiliser le nom du fichier"
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] placeholder-[#B5B3AB] focus:outline-none focus:border-[#1F8A5B]/50"
                />
              </div>

              <div>
                <label htmlFor="doc-category" className="block text-xs text-[#91908C] mb-1.5">Catégorie</label>
                <select
                  id="doc-category"
                  name="category"
                  defaultValue="autres"
                  required
                  aria-required="true"
                  className="w-full bg-[#F0EEE6] border border-[#181818]/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#1F8A5B]/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-[#91908C] hover:text-[#181818] border border-[#181818]/[0.08] rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  aria-busy={uploading}
                  className="flex-1 px-4 py-2.5 bg-[#1F8A5B] hover:bg-[#1F8A5B]/90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                >
                  {uploading ? 'Upload...' : 'Importer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
