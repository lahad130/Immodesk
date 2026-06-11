'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'Est-ce vraiment gratuit pour commencer ?',
    answer:
      'Oui. Le plan Gratuit vous permet de gérer jusqu\'à 50 biens sans carte bancaire et sans limite de durée. Vous passez au plan Pro uniquement quand votre activité grandit.',
  },
  {
    question: 'Le bail généré est-il conforme à la loi sénégalaise ?',
    answer:
      'Oui. ImmoDesk génère un contrat de location en PDF structuré selon la loi 77-60 régissant les baux à usage d\'habitation au Sénégal, avec les informations de votre agence, du bailleur et du locataire.',
  },
  {
    question: 'Puis-je suivre les paiements Wave et Orange Money ?',
    answer:
      'Oui. Pour chaque loyer encaissé, vous enregistrez le mode de paiement : espèces, Wave, Orange Money, virement bancaire ou chèque. Vos rapports de revenus restent toujours exacts.',
  },
  {
    question: 'Mes données sont-elles en sécurité ?',
    answer:
      'Vos données sont hébergées sur une infrastructure cloud sécurisée et chiffrée. Chaque agence est strictement isolée : seuls les membres de votre équipe peuvent accéder à vos biens, locataires et documents.',
  },
  {
    question: 'Est-ce que ça fonctionne sur téléphone ?',
    answer:
      'Oui. ImmoDesk fonctionne dans le navigateur de votre téléphone, tablette ou ordinateur, sans installation. Vous pouvez enregistrer un paiement ou relancer un locataire directement depuis le terrain.',
  },
  {
    question: 'Ai-je besoin d\'une formation pour l\'utiliser ?',
    answer:
      'Non. L\'interface est en français et pensée pour être prise en main en quelques minutes. Créez votre compte, ajoutez vos biens et vos locataires, et vous êtes opérationnel le jour même.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-[#0f0f0f] py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-[#3ECF8E] mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.question}
                className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-white">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 text-[#3ECF8E] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm text-[#888] leading-relaxed">{faq.answer}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
