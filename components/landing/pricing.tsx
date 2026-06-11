import Link from 'next/link'
import { whatsappLink } from '@/lib/contact'

const contactHref =
  whatsappLink('Bonjour, je suis intéressé par le plan Entreprise d’ImmoDesk.') ?? '/signup'

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
    ctaHref: contactHref,
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
    <section id="pricing" className="bg-[#F0EEE6] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-[#CC785C] mb-3">Tarifs</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#181818] tracking-tight">
            Des prix adaptés à l&apos;Afrique de l&apos;Ouest
          </h2>
          <p className="mt-4 text-[#62605B]">
            Tous les prix en FCFA · Facturation mensuelle · Annulez à tout moment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.featured
                  ? 'bg-white border-[#CC785C]/50 shadow-xl shadow-[#181818]/[0.06]'
                  : 'bg-white border-[#E6E4DA]'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#CC785C] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Recommandé
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-[#181818] mb-1">{plan.name}</h3>
                <p className="text-sm text-[#62605B]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#181818]">{plan.price}</span>
                  <span className="text-sm text-[#62605B]">FCFA{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#3D3D3A]">
                    <svg className="w-4 h-4 text-[#CC785C] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#B5B3AB]">
                    <svg className="w-4 h-4 text-[#D9D7CC] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.ctaHref.startsWith('http') ? (
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-4 rounded-full text-sm font-medium text-center transition ${
                    plan.featured
                      ? 'bg-[#181818] hover:bg-black text-white'
                      : 'bg-transparent hover:bg-[#181818]/5 text-[#181818] border border-[#181818]/25'
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-2.5 px-4 rounded-full text-sm font-medium text-center transition ${
                    plan.featured
                      ? 'bg-[#181818] hover:bg-black text-white'
                      : 'bg-transparent hover:bg-[#181818]/5 text-[#181818] border border-[#181818]/25'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
