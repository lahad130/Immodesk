import Link from 'next/link'

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    description: 'Pour démarrer et découvrir ImmoDesk.',
    cta: 'Commencer gratuitement',
    ctaHref: '/signup',
    featured: false,
    features: [
      'Jusqu\'à 50 biens',
      '1 utilisateur',
      'Gestion des clients',
      'Rapports de base',
      'Support par email',
    ],
    missing: ['Contrats illimités', 'Multi-utilisateurs', 'API & Intégrations'],
  },
  {
    name: 'Pro',
    price: '25 000',
    period: '/mois',
    description: 'Pour les agences en pleine croissance.',
    cta: 'Essayer Pro gratuitement',
    ctaHref: '/signup',
    featured: true,
    features: [
      'Biens illimités',
      '5 utilisateurs',
      'Gestion des contrats',
      'Statistiques avancées',
      'Notifications SMS & email',
      'Support prioritaire',
    ],
    missing: ['API & Intégrations'],
  },
  {
    name: 'Entreprise',
    price: '75 000',
    period: '/mois',
    description: 'Pour les grandes agences et réseaux.',
    cta: 'Contacter l\'équipe',
    ctaHref: '/signup',
    featured: false,
    features: [
      'Tout dans Pro',
      'Utilisateurs illimités',
      'API & Intégrations',
      'Domaine personnalisé',
      'Manager dédié',
      'SLA garanti',
    ],
    missing: [],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[#0a0a0a] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-[#3ECF8E] mb-3">Tarifs</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Des prix adaptés à l&apos;Afrique de l&apos;Ouest
          </h2>
          <p className="mt-4 text-[#888]">
            Tous les prix en FCFA · Facturation mensuelle · Annulez à tout moment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.featured
                  ? 'bg-[#3ECF8E]/5 border-[#3ECF8E]/30 shadow-[0_0_60px_rgba(62,207,142,0.08)]'
                  : 'bg-[#171717] border-white/[0.08]'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#3ECF8E] text-black text-xs font-bold px-3 py-1 rounded-full">
                    Recommandé
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-[#888]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-[#888]">FCFA{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#ccc]">
                    <svg className="w-4 h-4 text-[#3ECF8E] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#555]">
                    <svg className="w-4 h-4 text-[#333] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition ${
                  plan.featured
                    ? 'bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
