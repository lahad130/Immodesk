const docs = [
  { name: 'Contrat de vente — Villa Almadies.pdf', size: '2.4 Mo', type: 'pdf', date: '24 mai 2026', category: 'Contrats' },
  { name: 'Promesse de vente — Appart. Plateau.pdf', size: '1.8 Mo', type: 'pdf', date: '22 mai 2026', category: 'Contrats' },
  { name: 'Titre foncier — Terrain Diamniadio.pdf', size: '3.1 Mo', type: 'pdf', date: '20 mai 2026', category: 'Titres' },
  { name: 'Mandat exclusif — Villa Mermoz.pdf', size: '980 Ko', type: 'pdf', date: '18 mai 2026', category: 'Mandats' },
  { name: 'Certificat de propriété — Duplex Sacré-Cœur.pdf', size: '1.2 Mo', type: 'pdf', date: '15 mai 2026', category: 'Titres' },
  { name: 'Contrat de location — Bureau Zone 4.pdf', size: '890 Ko', type: 'pdf', date: '12 mai 2026', category: 'Contrats' },
  { name: 'Mandat de gestion — Immeuble Médina.pdf', size: '1.5 Mo', type: 'pdf', date: '10 mai 2026', category: 'Mandats' },
  { name: 'État des lieux — Appart. Liberté 6.pdf', size: '650 Ko', type: 'pdf', date: '8 mai 2026', category: 'Autres' },
]

const categories = ['Tous', 'Contrats', 'Titres', 'Mandats', 'Autres']

export default function DocumentsPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <p className="text-sm text-[#888]">{docs.length} documents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importer
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((c, i) => (
          <button
            key={c}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              i === 0
                ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20'
                : 'text-[#888] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.05]">
          {docs.map((doc) => (
            <div key={doc.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition group">
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                <p className="text-xs text-[#666] mt-0.5">
                  <span className="text-[#555] mr-2">{doc.category}</span>
                  {doc.size} · {doc.date}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
