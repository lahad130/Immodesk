import Header from '@/components/landing/header'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import Faq from '@/components/landing/faq'
import Footer from '@/components/landing/footer'
import WhatsappButton from '@/components/landing/whatsapp-button'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <Footer />
      <WhatsappButton />
    </div>
  )
}
