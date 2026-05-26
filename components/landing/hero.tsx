import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0f0f0f] pt-20 pb-24 lg:pt-28 lg:pb-32">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3ECF8E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
              <span className="text-xs text-[#3ECF8E] font-medium">CRM immobilier nouvelle génération</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Gérez votre agence{' '}
              <span className="text-[#3ECF8E]">sans effort</span>
            </h1>

            <p className="mt-5 text-lg text-[#888] leading-relaxed max-w-lg">
              ImmoDesk est le CRM conçu pour les agences immobilières d&apos;Afrique de l&apos;Ouest.
              Gérez vos biens, clients et transactions depuis une seule plateforme.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold rounded-xl text-sm transition"
              >
                Commencer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm transition"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {['AD', 'KT', 'BN', 'MF'].map((init) => (
                  <div
                    key={init}
                    className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#0f0f0f] flex items-center justify-center text-xs font-medium text-[#3ECF8E]"
                  >
                    {init}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#888]">
                <span className="text-white font-semibold">+200 agences</span> nous font confiance
              </p>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative lg:block">
            <div className="relative bg-[#171717] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#111]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4">
                  <div className="bg-[#0f0f0f] rounded-md px-3 py-1 text-xs text-[#555]">app.immodesk.com/dashboard</div>
                </div>
              </div>

              {/* Dashboard content mockup */}
              <div className="p-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Biens actifs', value: '124' },
                    { label: 'Clients', value: '87' },
                    { label: 'Ce mois', value: '4,2M' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-xs text-[#666] mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Property list */}
                <div className="space-y-2">
                  <p className="text-xs text-[#555] font-medium uppercase tracking-wider mb-3">Derniers biens</p>
                  {[
                    { name: 'Villa Cocody, Abidjan', price: '85 000 000 FCFA', status: 'Disponible', statusColor: '#3ECF8E' },
                    { name: 'Appart. Plateau, Dakar', price: '45 000 000 FCFA', status: 'Réservé', statusColor: '#F59E0B' },
                    { name: 'Bureau Zone 4, Abidjan', price: '120 000 000 FCFA', status: 'Disponible', statusColor: '#3ECF8E' },
                  ].map((prop) => (
                    <div key={prop.name} className="flex items-center justify-between bg-[#111] border border-white/[0.06] rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#3ECF8E]/10 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#3ECF8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{prop.name}</p>
                          <p className="text-xs text-[#666]">{prop.price}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: prop.statusColor, backgroundColor: `${prop.statusColor}18` }}>
                        {prop.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-[#171717] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
              <p className="text-xs text-[#888]">Revenus ce mois</p>
              <p className="text-lg font-bold text-[#3ECF8E]">12,4M FCFA</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
