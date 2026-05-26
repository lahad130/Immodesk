import Header from '@/components/landing/header'
import Hero from '@/components/landing/hero'
import Features from '@/components/landing/features'
import Pricing from '@/components/landing/pricing'
import Footer from '@/components/landing/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
