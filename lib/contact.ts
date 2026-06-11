// Numéro WhatsApp business au format international sans + ni espaces (ex: 221770000000).
// Défini via NEXT_PUBLIC_WHATSAPP_NUMBER sur Vercel ; les CTA WhatsApp
// ne s'affichent que si la variable est renseignée.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

export function whatsappLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
