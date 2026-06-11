'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string; ts: Date }

const SUGGESTIONS = [
  'Quels sont mes leads les plus chauds cette semaine ?',
  'Rédige un message de relance pour un client tiède',
  'Propose une description pour une villa aux Almadies',
  'Analyse mon taux de conversion ce mois-ci',
]

const MOCK_RESPONSES: Record<string, string> = {
  default: `Je suis votre assistant immobilier IA. Je peux vous aider à :

• **Analyser vos leads** et identifier les opportunités prioritaires
• **Rédiger des messages** de relance personnalisés
• **Créer des descriptions** de biens attractives
• **Interpréter vos métriques** de performance

Comment puis-je vous aider aujourd'hui ?`,
  relance: `Voici un message de relance pour un client tiède :

---

Bonjour [Prénom],

J'espère que vous allez bien. Je reviens vers vous concernant votre recherche immobilière à Dakar.

Nous avons récemment reçu plusieurs nouvelles opportunités qui correspondent parfaitement à vos critères :

• **Villa F4 à Mermoz** — 120M FCFA, jardin, garage
• **Appartement F3 au Plateau** — 85M FCFA, vue mer
• **Duplex au Sacré-Cœur** — 145M FCFA, terrasse

Seriez-vous disponible cette semaine pour une visite ? Je reste à votre disposition.

Cordialement,
*[Votre nom] — Agence Teranga Immo*

---

Souhaitez-vous que j'adapte ce message ?`,
  description: `Voici une description optimisée pour une villa aux Almadies :

---

**Villa de Prestige — Almadies, Dakar**

Nichée dans le quartier le plus prisé de Dakar, cette magnifique villa offre une expérience de vie exceptionnelle à quelques minutes de la mer.

**Caractéristiques :**
- Surface habitable : 380 m² sur terrain de 600 m²
- 5 chambres avec suites parentales
- Piscine privée + pool house
- Garage pour 3 véhicules
- Système de sécurité 24h/24

**Situation idéale** : A 5 min de la Route de la Corniche, proche ambassades et écoles internationales.

**Prix : 195 000 000 FCFA**

---

Voulez-vous que j'ajuste le ton ou certains détails ?`,
}

function getResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('relance') || lower.includes('message') || lower.includes('tiède') || lower.includes('tiede')) {
    return MOCK_RESPONSES.relance
  }
  if (lower.includes('description') || lower.includes('villa') || lower.includes('almadies') || lower.includes('bien')) {
    return MOCK_RESPONSES.description
  }
  return MOCK_RESPONSES.default
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          return <p key={i} className="flex gap-2"><span className="text-[#3ECF8E] shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: content }} /></p>
        }
        if (line === '---') {
          return <hr key={i} className="border-white/10 my-2" />
        }
        if (line === '') return <div key={i} className="h-1" />
        const html = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </div>
  )
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: MOCK_RESPONSES.default, ts: new Date() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim(), ts: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const reply: Message = { role: 'assistant', content: getResponse(text), ts: new Date() }
      setMessages((prev) => [...prev, reply])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#3ECF8E]/15 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Agent IA ImmoDesk</h2>
          <p className="text-xs text-[#3ECF8E]">● En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-[#3ECF8E] shrink-0 mt-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-white rounded-tr-sm'
                  : 'bg-[#171717] border border-white/[0.08] text-[#ccc] rounded-tl-sm'
              }`}
            >
              {m.role === 'assistant' ? <MarkdownText text={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center text-[#3ECF8E] shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
              </svg>
            </div>
            <div className="bg-[#171717] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]/50 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#aaa] hover:text-white transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input) }}
          className="flex gap-2 bg-[#171717] border border-white/[0.08] rounded-2xl p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question à votre assistant IA..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#555] px-2 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
