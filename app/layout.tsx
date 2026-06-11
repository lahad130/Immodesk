import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://immodesk.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ImmoDesk — Logiciel de gestion locative au Sénégal",
    template: "%s — ImmoDesk",
  },
  description:
    "Suivez vos loyers, relancez les retards sur WhatsApp et générez baux et quittances PDF conformes à la loi 77-60. La gestion locative simple pour les agences immobilières du Sénégal et d'Afrique de l'Ouest.",
  keywords: [
    "gestion locative Sénégal",
    "logiciel immobilier Dakar",
    "gestion immobilière Afrique de l'Ouest",
    "quittance de loyer PDF",
    "bail loi 77-60",
    "suivi des loyers",
    "CRM immobilier FCFA",
  ],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: siteUrl,
    siteName: "ImmoDesk",
    title: "ImmoDesk — Logiciel de gestion locative au Sénégal",
    description:
      "Loyers, baux, quittances PDF et relances WhatsApp : la gestion locative simple pour les agences immobilières du Sénégal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImmoDesk — Logiciel de gestion locative au Sénégal",
    description:
      "Loyers, baux, quittances PDF et relances WhatsApp : la gestion locative simple pour les agences immobilières du Sénégal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0f0f0f] text-white">{children}</body>
    </html>
  );
}
