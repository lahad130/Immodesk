import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Document, DocumentCategory } from '@/lib/types'
import Link from 'next/link'
import UploadDocumentModal from '@/components/dashboard/upload-document-modal'
import DeleteDocumentButton from '@/components/dashboard/delete-document-button'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contrat: 'Contrat',
  titre: 'Titre',
  mandat: 'Mandat',
  bail: 'Bail',
  quittance: 'Quittance',
  etat_des_lieux: 'État des lieux',
  autres: 'Autres',
}

const FILTER_OPTIONS = [
  { value: 'tous', label: 'Tous' },
  { value: 'contrat', label: 'Contrats' },
  { value: 'titre', label: 'Titres' },
  { value: 'mandat', label: 'Mandats' },
  { value: 'bail', label: 'Baux' },
  { value: 'autres', label: 'Autres' },
] as const

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} Mo`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} Ko`
  return `${bytes} o`
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const { filtre = 'tous' } = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .single()

  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (filtre !== 'tous') {
    query = query.eq('category', filtre)
  }

  const { data: docs } = await query

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <p className="text-sm text-[#888]">
            {(docs ?? []).length} document{(docs ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
        {profile?.agency_id && (
          <UploadDocumentModal agencyId={profile.agency_id} />
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/documents?filtre=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              filtre === opt.value
                ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30'
                : 'text-[#888] hover:text-white border-white/[0.08] hover:border-white/20'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.05]">
          {(docs ?? []).length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">
                {filtre !== 'tous' ? 'Aucun document pour cette catégorie' : 'Aucun document importé'}
              </p>
              {filtre === 'tous' && (
                <p className="text-xs text-[#444] mt-1">
                  Cliquez sur &quot;Importer&quot; pour ajouter un document
                </p>
              )}
            </div>
          ) : (
            (docs as Document[]).map((doc) => {
              const isPdf = doc.mime_type === 'application/pdf' || doc.name.endsWith('.pdf')
              const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(doc.storage_path)

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPdf
                        ? 'bg-red-500/10 border border-red-500/10'
                        : 'bg-blue-500/10 border border-blue-500/10'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${isPdf ? 'text-red-400' : 'text-blue-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <p className="text-xs text-[#666] mt-0.5">
                      <span className="text-[#555] mr-2">
                        {CATEGORY_LABELS[doc.category as DocumentCategory] ?? doc.category}
                      </span>
                      {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Voir le document"
                      className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <a
                      href={publicUrl}
                      download={doc.name}
                      aria-label="Télécharger"
                      className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <DeleteDocumentButton documentId={doc.id} storagePath={doc.storage_path} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
