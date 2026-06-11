import Link from 'next/link'
import { whatsappLink } from '@/lib/contact'

export default function Hero() {
  const demoLink = whatsappLink('Bonjour, je souhaite une démo d’ImmoDesk pour mon agence.')

  return (
    <section className="relative overflow-hidden bg-[#FAF9F5] pt-20 pb-24 lg:pt-28 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CC785C]/10 border border-[#CC785C]/25 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CC785C]" />
              <span className="text-xs text-[#CC785C] font-medium">Gestion locative · Sénégal 🇸🇳</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-[#181818] leading-[1.1] tracking-tight">
              Encaissez vos loyers à temps,{' '}
              <span className="text-[#CC785C]">chaque mois</span>
            </h1>

            <p className="mt-6 text-lg text-[#62605B] leading-relaxed max-w-lg">
              ImmoDesk aide les agences et gérants immobiliers à suivre leurs loyers,
              relancer les retards sur WhatsApp et générer baux et quittances PDF
              conformes à la loi sénégalaise — en quelques clics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#181818] hover:bg-black text-white font-medium rounded-full text-sm transition"
              >
                Commencer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              {demoLink ? (
                <a
                  href={demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-[#181818]/5 text-[#181818] border border-[#181818]/25 rounded-full text-sm font-medium transition"
                >
                  <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Demander une démo
                </a>
              ) : (
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-[#181818]/5 text-[#181818] border border-[#181818]/25 rounded-full text-sm font-medium transition"
                >
                  Voir les fonctionnalités
                </a>
              )}
            </div>

            <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
              {['Gratuit pour démarrer', 'Sans carte bancaire', 'Bail conforme loi 77-60'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[#62605B]">
                  <svg className="w-4 h-4 text-[#CC785C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative lg:block">
            <div className="relative bg-white border border-[#E6E4DA] rounded-3xl overflow-hidden shadow-xl shadow-[#181818]/[0.06]">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E6E4DA] bg-[#F0EEE6]">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-[#91908C]">app.immodesk.com/dashboard/loyers</div>
                </div>
              </div>

              {/* Dashboard content mockup */}
              <div className="p-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Loyers encaissés', value: '4,2M' },
                    { label: 'Occupation', value: '92%' },
                    { label: 'En retard', value: '2' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#FAF9F5] border border-[#E6E4DA] rounded-xl p-3">
                      <p className="text-xs text-[#91908C] mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-[#181818]">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Rent list */}
                <div className="space-y-2">
                  <p className="text-xs text-[#91908C] font-medium uppercase tracking-wider mb-3">Loyers du mois</p>
                  {[
                    { name: 'Mamadou Diallo · Appart. Plateau', price: '350 000 FCFA', status: 'Payé', statusColor: '#15803D' },
                    { name: 'Awa Ndiaye · Villa Almadies', price: '850 000 FCFA', status: 'En attente', statusColor: '#B45309' },
                    { name: 'Ibrahima Sarr · Studio Mermoz', price: '175 000 FCFA', status: 'Retard', statusColor: '#DC2626' },
                  ].map((rent) => (
                    <div key={rent.name} className="flex items-center justify-between bg-[#FAF9F5] border border-[#E6E4DA] rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#CC785C]/10 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#CC785C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#181818]">{rent.name}</p>
                          <p className="text-xs text-[#91908C]">{rent.price}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: rent.statusColor, backgroundColor: `${rent.statusColor}14` }}>
                        {rent.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-[#E6E4DA] rounded-2xl px-4 py-3 shadow-lg shadow-[#181818]/[0.08]">
              <p className="text-xs text-[#62605B]">Revenus ce mois</p>
              <p className="text-lg font-bold text-[#15803D]">12,4M FCFA</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
