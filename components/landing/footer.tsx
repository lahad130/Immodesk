import { whatsappLink } from '@/lib/contact'

const contactHref = whatsappLink('Bonjour, j’ai une question sur ImmoDesk.')

const footerLinks = {
  Produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Compte: [
    { label: 'Créer un compte', href: '/signup' },
    { label: 'Se connecter', href: '/login' },
  ],
  Support: contactHref
    ? [{ label: 'Contact WhatsApp', href: contactHref }]
    : [{ label: 'FAQ', href: '#faq' }],
}

export default function Footer() {
  return (
    <footer id="about" className="bg-[#F0EEE6] border-t border-[#181818]/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#CC785C] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
                </svg>
              </div>
              <span className="text-base font-bold text-[#181818]">Immo<span className="text-[#CC785C]">Desk</span></span>
            </div>
            <p className="text-sm text-[#62605B] leading-relaxed">
              La gestion locative simple pour les agences immobilières du Sénégal
              et d&apos;Afrique de l&apos;Ouest.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-[#181818] uppercase tracking-wider mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#62605B] hover:text-[#181818] transition">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#181818]/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#91908C]">
            © {new Date().getFullYear()} ImmoDesk. Tous droits réservés.
          </p>
          <p className="text-sm text-[#91908C]">
            Fait avec soin pour l&apos;Afrique de l&apos;Ouest 🌍
          </p>
        </div>
      </div>
    </footer>
  )
}
