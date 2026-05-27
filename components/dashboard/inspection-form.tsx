'use client'

import { useTransition, useState, useRef } from 'react'
import Link from 'next/link'
import { createInspection } from '@/app/dashboard/inspections/new/actions'
import { createClient } from '@/lib/supabase/client'

export interface Property {
  id: string
  title: string
  neighborhood: string | null
  city: string
}

export interface LeaseOption {
  id: string
  start_date: string
  end_date: string
  tenant: { full_name: string } | null
  property: { title: string } | null
}

interface InspectionFormProps {
  properties: Property[]
  leases: LeaseOption[]
}

async function uploadPhoto(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('inspections')
    .upload(path, file, { upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('inspections').getPublicUrl(path)

  return data.publicUrl
}

const inputClass =
  'bg-[#111] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white w-full focus:outline-none focus:border-[#3ECF8E]/50'
const labelClass = 'block text-sm text-[#888] mb-1.5'

export default function InspectionForm({ properties, leases }: InspectionFormProps) {
  const [pending, startTransition] = useTransition()
  const [propertyId, setPropertyId] = useState('')
  const [leaseId, setLeaseId] = useState('')
  const [type, setType] = useState<'entree' | 'sortie' | ''>('')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [notes, setNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = 10 - photoUrls.length
    if (remaining <= 0) {
      setUploadError('Limite de 10 photos atteinte.')
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploading(true)
    setUploadError(null)

    const results: string[] = []
    for (const file of toUpload) {
      try {
        const url = await uploadPhoto(file)
        results.push(url)
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Erreur lors du téléchargement.',
        )
        break
      }
    }

    setPhotoUrls((prev) => [...prev, ...results])
    setUploading(false)

    // Reset file input so the same file can be re-selected after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!propertyId) {
      setError('Veuillez sélectionner un bien.')
      return
    }
    if (!type) {
      setError("Veuillez sélectionner le type d'inspection.")
      return
    }
    if (!inspectionDate) {
      setError('Veuillez sélectionner une date.')
      return
    }

    const formData = new FormData()
    formData.set('property_id', propertyId)
    if (leaseId) formData.set('lease_id', leaseId)
    formData.set('type', type)
    formData.set('inspection_date', inspectionDate)
    if (notes.trim()) formData.set('notes', notes)
    formData.set('photos', JSON.stringify(photoUrls))

    startTransition(() => createInspection(formData))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        {/* Bien */}
        <div>
          <label htmlFor="property_id" className={labelClass}>
            Bien <span className="text-[#3ECF8E]">*</span>
          </label>
          <select
            id="property_id"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sélectionner un bien...</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.neighborhood ? ` — ${p.neighborhood}` : ''}, {p.city}
              </option>
            ))}
          </select>
        </div>

        {/* Bail / locataire */}
        <div>
          <label htmlFor="lease_id" className={labelClass}>
            Bail / locataire
          </label>
          <select
            id="lease_id"
            value={leaseId}
            onChange={(e) => setLeaseId(e.target.value)}
            className={inputClass}
          >
            <option value="">Aucun bail associé</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.tenant?.full_name ?? '?'} — {l.property?.title ?? '?'}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <p className={labelClass}>
            Type <span className="text-[#3ECF8E]">*</span>
          </p>
          <div className="flex gap-2">
            {(
              [
                { value: 'entree', label: 'Entrée' },
                { value: 'sortie', label: 'Sortie' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                  type === value
                    ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30'
                    : 'text-[#666] hover:text-white border border-white/[0.08]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="inspection_date" className={labelClass}>
            Date <span className="text-[#3ECF8E]">*</span>
          </label>
          <input
            id="inspection_date"
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations sur l'état du bien..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Photos */}
        <div>
          <p className={labelClass}>Photos ({photoUrls.length}/10)</p>
          <label
            className={`flex items-center gap-2 cursor-pointer ${inputClass} w-fit px-4 py-2 ${
              uploading || photoUrls.length >= 10
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <svg
              className="w-4 h-4 text-[#888]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[#888] text-sm">
              {uploading ? 'Téléchargement...' : 'Ajouter des photos'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || photoUrls.length >= 10}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {uploadError && (
            <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>
          )}

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {photoUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-[#111]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    aria-label="Supprimer cette photo"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/inspections"
            className="text-[#666] hover:text-white text-sm transition"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={pending || uploading}
            className="px-5 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition"
          >
            {pending ? 'Enregistrement...' : "Créer l'état des lieux"}
          </button>
        </div>
      </div>
    </form>
  )
}
