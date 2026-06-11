const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Suivi des loyers',
    description: 'Visualisez d\'un coup d\'œil qui a payé, qui est en attente et qui est en retard. Espèces, Wave, Orange Money, virement ou chèque.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'Relances WhatsApp',
    description: 'Relancez les locataires en retard en un clic avec un message WhatsApp pré-rédigé. Fini les appels qui restent sans réponse.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Bail conforme loi 77-60',
    description: 'Générez un contrat de location sénégalais en PDF, prêt à signer, avec les informations de votre agence, du bailleur et du locataire.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Quittances PDF automatiques',
    description: 'Chaque paiement enregistré peut générer sa quittance de loyer en PDF, à envoyer au locataire en une seconde.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: 'États des lieux',
    description: 'Réalisez vos états des lieux d\'entrée et de sortie avec photos, et exportez le rapport en PDF pour le dossier du locataire.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    title: 'Documents centralisés',
    description: 'Contrats, titres de propriété, mandats, baux et quittances stockés en sécurité et accessibles depuis n\'importe où.',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-[#FAF9F5] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-[#CC785C] mb-3">Fonctionnalités</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#181818] tracking-tight">
            Toute votre gestion locative, au même endroit
          </h2>
          <p className="mt-4 text-[#62605B] max-w-xl mx-auto">
            Remplacez les cahiers, fichiers Excel et reçus papier par un outil pensé
            pour le marché immobilier sénégalais.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white border border-[#E6E4DA] hover:border-[#CC785C]/40 hover:shadow-md hover:shadow-[#181818]/[0.04] rounded-3xl p-6 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-[#CC785C]/10 group-hover:bg-[#CC785C]/15 flex items-center justify-center text-[#CC785C] mb-4 transition">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-[#181818] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#62605B] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
