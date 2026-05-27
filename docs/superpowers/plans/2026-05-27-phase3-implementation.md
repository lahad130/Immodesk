# Phase 3 — Paiements, Bail PDF, Dashboard Loyers, Documents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la gestion complète des loyers FCFA (Orange Money/Wave/espèces), bail PDF droit sénégalais, dashboard loyers avec graphique Recharts, relances WhatsApp, et gestion réelle des documents Supabase Storage.

**Architecture:** Chaque feature Phase 3 s'appuie sur les tables Phase 2 (tenants, leases, payments, inspections). On ajoute une colonne `payment_method` à `payments`, une table `documents`, et une nouvelle route `/dashboard/loyers`. Le bail PDF est un nouveau composant `@react-pdf/renderer` servi via Route Handler. Les documents réels remplacent le stub dans `app/dashboard/documents/`.

**Tech Stack:** Next.js 16 App Router, Supabase (RLS), @react-pdf/renderer v4.5.1, Recharts v3.8.1, Tailwind CSS v4, TypeScript, Supabase Storage (bucket `documents`)

**Conventions impératives:**
- Pas d'emojis dans l'UI ou le code — projet B2B pro
- Devise exclusive FCFA (formatFCFA de lib/format.ts)
- Dark theme: bg `#0f0f0f`, cartes `#171717`, vert `#3ECF8E`, bordures `rgba(255,255,255,0.08)`
- `params: Promise<{ id: string }>` — toujours awaiter dans les Server Components et Route Handlers
- RLS: toujours WITH CHECK explicite identique au USING
- Server Actions: fichier `actions.ts` à côté de la page, `'use server'` en haut du fichier

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `supabase/migrations/20260527100000_phase3.sql` | Créer |
| `lib/types.ts` | Modifier (PaymentMethod, Document, mise à jour Payment) |
| `app/dashboard/locataires/[id]/actions.ts` | Modifier (ajouter enregistrerPaiement) |
| `components/dashboard/enregistrer-paiement-modal.tsx` | Créer |
| `app/dashboard/locataires/[id]/page.tsx` | Modifier (bouton + colonne méthode) |
| `components/pdf/quittance-doc.tsx` | Modifier (ajouter payment_method) |
| `app/api/quittance/[paymentId]/route.ts` | Modifier (sélectionner payment_method) |
| `app/dashboard/loyers/page.tsx` | Créer |
| `components/dashboard/revenus-chart.tsx` | Créer |
| `components/dashboard/sidebar.tsx` | Modifier (ajouter Loyers) |
| `components/pdf/bail-doc.tsx` | Créer |
| `app/api/bail/[leaseId]/route.ts` | Créer |
| `app/dashboard/documents/page.tsx` | Réécrire |
| `components/dashboard/upload-document-modal.tsx` | Créer |
| `app/dashboard/documents/actions.ts` | Créer |

---

## Task 1 : Migration Phase 3 + mise à jour types

**Files:**
- Create: `supabase/migrations/20260527100000_phase3.sql`
- Modify: `lib/types.ts`

- [ ] **Step 1 : Écrire la migration**

```sql
-- supabase/migrations/20260527100000_phase3.sql

-- Méthode de paiement sur les paiements
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method text
  CHECK (
    payment_method IS NULL OR
    payment_method = ANY(ARRAY['especes','orange_money','wave','virement','cheque'])
  );

-- Table documents (stockage par bien/locataire)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'autres'
    CHECK (category = ANY(ARRAY['contrat','titre','mandat','bail','quittance','etat_des_lieux','autres'])),
  storage_path text NOT NULL,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_documents" ON documents
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );
```

- [ ] **Step 2 : Appliquer via MCP Supabase**

Utiliser l'outil `mcp__supabase__apply_migration` avec le contenu ci-dessus.

Vérifier avec `mcp__supabase__execute_sql` :
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method';
SELECT table_name FROM information_schema.tables WHERE table_name = 'documents';
```

Résultat attendu : les deux requêtes retournent une ligne.

- [ ] **Step 3 : Mettre à jour lib/types.ts**

Ajouter après les types existants de Phase 2 (après `IncidentStatus`) :

```typescript
export type PaymentMethod = 'especes' | 'orange_money' | 'wave' | 'virement' | 'cheque'

export type DocumentCategory = 'contrat' | 'titre' | 'mandat' | 'bail' | 'quittance' | 'etat_des_lieux' | 'autres'
```

Modifier l'interface `Payment` pour ajouter `payment_method` :

```typescript
export interface Payment {
  id: string
  lease_id: string
  amount_fcfa: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  payment_method: PaymentMethod | null   // ← ajouter cette ligne
  created_at: string
  // joined
  lease?: Lease | null
}
```

Ajouter l'interface `Document` en bas du fichier :

```typescript
export interface Document {
  id: string
  agency_id: string
  property_id: string | null
  tenant_id: string | null
  lease_id: string | null
  name: string
  category: DocumentCategory
  storage_path: string
  size_bytes: number | null
  mime_type: string | null
  created_at: string
}
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur liée aux nouveaux types.

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/20260527100000_phase3.sql lib/types.ts
git commit -m "feat: phase3 migration — payment_method + documents table"
```

---

## Task 2 : Enregistrer un paiement (Server Action + Modal)

**Files:**
- Modify: `app/dashboard/locataires/[id]/actions.ts`
- Create: `components/dashboard/enregistrer-paiement-modal.tsx`
- Modify: `app/dashboard/locataires/[id]/page.tsx`

- [ ] **Step 1 : Ajouter le Server Action enregistrerPaiement**

Dans `app/dashboard/locataires/[id]/actions.ts`, ajouter après l'import existant et la fonction `resolveIncident` :

```typescript
export async function enregistrerPaiement(formData: FormData) {
  const supabase = await createClient()
  const leaseId = formData.get('lease_id') as string
  const amountFcfa = parseInt(formData.get('amount_fcfa') as string, 10)
  const dueDate = formData.get('due_date') as string
  const rawPaidDate = formData.get('paid_date') as string
  const paidDate = rawPaidDate || null
  const status = formData.get('status') as string
  const rawMethod = formData.get('payment_method') as string
  const paymentMethod = rawMethod || null

  const { error } = await supabase.from('payments').insert({
    lease_id: leaseId,
    amount_fcfa: amountFcfa,
    due_date: dueDate,
    paid_date: paidDate,
    status,
    payment_method: paymentMethod,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/locataires/${leaseId}`)
}
```

Le fichier actions.ts complet doit commencer par :
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
```

- [ ] **Step 2 : Créer le modal enregistrer-paiement-modal.tsx**

```typescript
'use client'

import { useState, useTransition, useRef } from 'react'
import { enregistrerPaiement } from '@/app/dashboard/locataires/[id]/actions'

const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
]

export default function EnregistrerPaiementModal({
  leaseId,
  monthlyRent,
}: {
  leaseId: string
  monthlyRent: number
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await enregistrerPaiement(formData)
        setOpen(false)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-xs font-semibold rounded-lg transition"
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Enregistrer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pmt-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        >
          <div className="bg-[#161616] border border-white/[0.09] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 id="pmt-modal-title" className="text-sm font-semibold text-white">Enregistrer un paiement</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[#555] hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="hidden" name="lease_id" value={leaseId} />

              <div>
                <label htmlFor="pmt-due-date" className="block text-xs text-[#666] mb-1.5">Période (date d'échéance)</label>
                <input
                  id="pmt-due-date"
                  name="due_date"
                  type="date"
                  defaultValue={firstOfMonth}
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-amount" className="block text-xs text-[#666] mb-1.5">Montant (FCFA)</label>
                <input
                  id="pmt-amount"
                  name="amount_fcfa"
                  type="number"
                  defaultValue={monthlyRent}
                  min={1}
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-status" className="block text-xs text-[#666] mb-1.5">Statut</label>
                <select
                  id="pmt-status"
                  name="status"
                  defaultValue="paye"
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                >
                  <option value="paye">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="retard">Retard</option>
                </select>
              </div>

              <div>
                <label htmlFor="pmt-paid-date" className="block text-xs text-[#666] mb-1.5">Date de paiement (si payé)</label>
                <input
                  id="pmt-paid-date"
                  name="paid_date"
                  type="date"
                  defaultValue={today}
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="pmt-method" className="block text-xs text-[#666] mb-1.5">Moyen de paiement</label>
                <select
                  id="pmt-method"
                  name="payment_method"
                  defaultValue="especes"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                >
                  <option value="">Non précisé</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-[#666] hover:text-white border border-white/[0.08] rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  className="flex-1 px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition"
                >
                  {isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3 : Modifier app/dashboard/locataires/[id]/page.tsx**

Ajouter l'import du modal en haut du fichier :
```typescript
import EnregistrerPaiementModal from '@/components/dashboard/enregistrer-paiement-modal'
```

Dans la section "Historique des paiements", remplacer le header existant :
```tsx
// Remplacer :
<div className="px-5 py-4 border-b border-white/[0.07]">
  <h3 className="text-sm font-semibold text-white">Historique des paiements</h3>
  <p className="text-xs text-[#666] mt-0.5">{(payments ?? []).length} paiement{...}</p>
</div>

// Par :
<div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
  <div>
    <h3 className="text-sm font-semibold text-white">Historique des paiements</h3>
    <p className="text-xs text-[#666] mt-0.5">{(payments ?? []).length} paiement{(payments ?? []).length !== 1 ? 's' : ''}</p>
  </div>
  <EnregistrerPaiementModal leaseId={id} monthlyRent={lease.monthly_rent} />
</div>
```

Dans le tableau des paiements, ajouter une colonne "Méthode" dans le `<thead>` après "Statut" :
```tsx
<th className="px-5 py-3 text-left text-xs text-[#555] font-semibold uppercase tracking-wide">Méthode</th>
```

Et dans chaque `<tr>` de paiement, ajouter la cellule après le statut et avant la quittance :
```tsx
<td className="px-5 py-3.5 text-xs text-[#666]">
  {payment.payment_method === 'orange_money' ? 'Orange Money'
    : payment.payment_method === 'wave' ? 'Wave'
    : payment.payment_method === 'especes' ? 'Espèces'
    : payment.payment_method === 'virement' ? 'Virement'
    : payment.payment_method === 'cheque' ? 'Chèque'
    : <span className="text-[#444]">—</span>}
</td>
```

Mettre à jour le select du tableau `<table>` pour inclure `payment_method` :
```typescript
// Ligne existante :
supabase.from('payments').select('*').eq('lease_id', id).order('due_date', { ascending: false })
// Reste identique — '*' récupère déjà payment_method après la migration
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add app/dashboard/locataires/[id]/actions.ts components/dashboard/enregistrer-paiement-modal.tsx app/dashboard/locataires/[id]/page.tsx
git commit -m "feat: enregistrement paiement — modal Orange Money/Wave/espèces"
```

---

## Task 3 : Quittance PDF avec moyen de paiement

**Files:**
- Modify: `components/pdf/quittance-doc.tsx`
- Modify: `app/api/quittance/[paymentId]/route.ts`

- [ ] **Step 1 : Mettre à jour QuittanceProps**

Dans `components/pdf/quittance-doc.tsx`, modifier l'interface `QuittanceProps` :

```typescript
export interface QuittanceProps {
  agency: {
    name: string
    city: string | null
    country: string | null
    phone: string | null
  }
  tenant: {
    full_name: string
    phone: string | null
    email: string | null
  }
  property: {
    title: string
    neighborhood: string | null
    city: string
  } | null
  payment: {
    id: string
    amount_fcfa: number
    due_date: string
    paid_date: string | null
    status: 'paye' | 'en_attente' | 'retard' | string
    payment_method: string | null   // ← ajouter
  }
  lease: {
    start_date: string
    end_date: string
    monthly_rent: number
  }
}
```

- [ ] **Step 2 : Afficher le moyen de paiement dans le PDF**

Dans `components/pdf/quittance-doc.tsx`, dans la section "Détails du paiement" (après le bloc `Montant`), ajouter :

```tsx
{payment.payment_method ? (
  <View style={styles.detailRow}>
    <Text style={styles.detailKey}>Moyen</Text>
    <Text style={styles.detailValue}>
      {payment.payment_method === 'orange_money' ? 'Orange Money'
        : payment.payment_method === 'wave' ? 'Wave'
        : payment.payment_method === 'especes' ? 'Espèces'
        : payment.payment_method === 'virement' ? 'Virement'
        : payment.payment_method === 'cheque' ? 'Chèque'
        : payment.payment_method}
    </Text>
  </View>
) : null}
```

- [ ] **Step 3 : Mettre à jour le Route Handler quittance**

Dans `app/api/quittance/[paymentId]/route.ts`, modifier le SELECT pour inclure `payment_method` :

```typescript
// La requête existante sélectionne déjà * sur payments — payment_method est inclus automatiquement
// Mais il faut passer payment_method dans props. Ajouter dans l'objet props.payment :
payment: {
  id: String(payment.id ?? ''),
  amount_fcfa: Number(payment.amount_fcfa ?? 0),
  due_date: String(payment.due_date ?? ''),
  paid_date: payment.paid_date ? String(payment.paid_date) : null,
  status: String(payment.status ?? 'en_attente'),
  payment_method: payment.payment_method ? String(payment.payment_method) : null,  // ← ajouter
},
```

Lire le fichier `app/api/quittance/[paymentId]/route.ts` avant d'éditer pour connaître la structure exacte.

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add components/pdf/quittance-doc.tsx app/api/quittance/[paymentId]/route.ts
git commit -m "feat: quittance PDF affiche le moyen de paiement"
```

---

## Task 4 : Dashboard loyers — métriques + relances WhatsApp

**Files:**
- Create: `app/dashboard/loyers/page.tsx`
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1 : Ajouter "Loyers" dans la sidebar**

Dans `components/dashboard/sidebar.tsx`, ajouter l'entrée "Loyers" après l'entrée "Inspections" dans le tableau `nav` (avant l'entrée `ai-agent`) :

```typescript
{
  href: '/dashboard/loyers',
  label: 'Loyers',
  icon: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
},
```

- [ ] **Step 2 : Créer app/dashboard/loyers/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import RevenusChart from '@/components/dashboard/revenus-chart'

const paymentMethodLabel: Record<string, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  wave: 'Wave',
  virement: 'Virement',
  cheque: 'Chèque',
}

export default async function LoyersPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  // Loyers attendus ce mois = somme des loyers mensuels des baux actifs
  const { data: activeLeases } = await supabase
    .from('leases')
    .select('id, monthly_rent, tenant_id, property_id')
    .eq('status', 'actif')

  const loyersAttendus = (activeLeases ?? []).reduce((sum, l) => sum + (l.monthly_rent as number), 0)

  // Loyers reçus ce mois = somme des paiements payés ce mois
  const { data: paymentsDuThisMonth } = await supabase
    .from('payments')
    .select('amount_fcfa, status, due_date')
    .gte('due_date', startOfMonth)
    .lte('due_date', endOfMonth)

  const loyersRecus = (paymentsDuThisMonth ?? [])
    .filter((p) => p.status === 'paye')
    .reduce((sum, p) => sum + (p.amount_fcfa as number), 0)

  const tauxRecouvrement = loyersAttendus > 0 ? Math.round((loyersRecus / loyersAttendus) * 100) : 0

  // Paiements en retard avec info bail+locataire+bien
  const { data: retardPayments } = await supabase
    .from('payments')
    .select(`
      id,
      amount_fcfa,
      due_date,
      lease:lease_id(
        id,
        monthly_rent,
        tenant:tenant_id(full_name, whatsapp),
        property:property_id(title)
      )
    `)
    .eq('status', 'retard')
    .order('due_date', { ascending: true })
    .limit(20)

  // Données graphique 6 mois
  const monthData: { month: string; attendus: number; recus: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = d.toISOString().slice(0, 10)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })

    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount_fcfa, status')
      .gte('due_date', start)
      .lte('due_date', end)

    const recus = (monthPayments ?? [])
      .filter((p) => p.status === 'paye')
      .reduce((sum, p) => sum + (p.amount_fcfa as number), 0)

    monthData.push({ month: label, attendus: loyersAttendus, recus })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Loyers</h2>
        <p className="text-sm text-[#888]">Vue d'ensemble des encaissements</p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Attendus ce mois</p>
          <p className="text-2xl font-bold text-white">{formatFCFA(loyersAttendus)}</p>
          <p className="text-xs text-[#666] mt-1">{(activeLeases ?? []).length} bail{(activeLeases ?? []).length !== 1 ? 's' : ''} actif{(activeLeases ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Reçus ce mois</p>
          <p className="text-2xl font-bold text-[#3ECF8E]">{formatFCFA(loyersRecus)}</p>
          <p className="text-xs text-[#666] mt-1">Paiements validés</p>
        </div>
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-semibold mb-2">Taux recouvrement</p>
          <p className={`text-2xl font-bold ${tauxRecouvrement >= 80 ? 'text-[#3ECF8E]' : tauxRecouvrement >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
            {tauxRecouvrement}%
          </p>
          <p className="text-xs text-[#666] mt-1">{formatFCFA(loyersAttendus - loyersRecus)} restant</p>
        </div>
      </div>

      {/* Graphique 6 mois */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">Revenus 6 derniers mois</h3>
        </div>
        <div className="p-5">
          <RevenusChart data={monthData} />
        </div>
      </div>

      {/* Top impayés + relances */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">Impayés — relances WhatsApp</h3>
          <p className="text-xs text-[#666] mt-0.5">{(retardPayments ?? []).length} paiement{(retardPayments ?? []).length !== 1 ? 's' : ''} en retard</p>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(retardPayments ?? []).length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-[#555]">Aucun impayé</p>
            </div>
          ) : (
            (retardPayments ?? []).map((pmt) => {
              type LeaseJoined = {
                id: string
                monthly_rent: number
                tenant: { full_name: string; whatsapp: string | null } | null
                property: { title: string } | null
              } | null
              const lease = pmt.lease as LeaseJoined
              const tenant = lease?.tenant ?? null
              const whatsapp = (tenant?.whatsapp ?? '').replace(/\D/g, '')
              const dueDate = new Date(pmt.due_date as string)
              const daysLate = Math.floor((Date.now() - dueDate.getTime()) / 86_400_000)
              const propertyTitle = lease?.property?.title ?? 'Bien non assigné'
              const waMessage = encodeURIComponent(
                `Bonjour ${tenant?.full_name ?? 'cher locataire'}, votre loyer de ${formatFCFA(pmt.amount_fcfa as number)} pour ${propertyTitle} est en retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}. Merci de régulariser. Quittance : ${baseUrl}/api/quittance/${pmt.id}`
              )
              return (
                <div key={pmt.id as string} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tenant?.full_name ?? '—'}</p>
                    <p className="text-xs text-[#666] truncate">{propertyTitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-red-400">{formatFCFA(pmt.amount_fcfa as number)}</p>
                    <p className="text-xs text-[#555]">{daysLate}j de retard</p>
                  </div>
                  {tenant?.whatsapp ? (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/15 hover:bg-green-600/25 text-green-400 text-xs font-medium rounded-lg transition shrink-0"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Relancer
                    </a>
                  ) : (
                    <span className="text-xs text-[#444] w-20 text-right">Pas de WhatsApp</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur (le composant RevenusChart n'existe pas encore — s'il y a une erreur sur cet import uniquement, c'est normal, sera résolu en Task 5).

- [ ] **Step 4 : Commit (partiel — sans RevenusChart)**

```bash
git add app/dashboard/loyers/page.tsx components/dashboard/sidebar.tsx
git commit -m "feat: dashboard loyers — métriques, impayés, relances WhatsApp"
```

---

## Task 5 : Graphique revenus Recharts

**Files:**
- Create: `components/dashboard/revenus-chart.tsx`

Note: Recharts est déjà installé (utilisé dans Phase 2 pour `occupation-chart.tsx`). Vérifier avec `ls node_modules/recharts` avant de commencer.

- [ ] **Step 1 : Vérifier que Recharts est disponible**

```bash
ls /Users/toure/immodesk/node_modules/recharts/package.json && echo "OK"
```

Résultat attendu : `OK`. Si absent : `npm install recharts`.

- [ ] **Step 2 : Créer components/dashboard/revenus-chart.tsx**

```typescript
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface RevenusChartProps {
  data: { month: string; attendus: number; recus: number }[]
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs">
      <p className="text-[#888] mb-1.5 font-semibold uppercase tracking-wide">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-[#aaa]">{entry.name === 'attendus' ? 'Attendus' : 'Reçus'} :</span>
          <span className="text-white font-semibold">{formatK(entry.value)} FCFA</span>
        </div>
      ))}
    </div>
  )
}

export default function RevenusChart({ data }: RevenusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#555', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fill: '#555', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#666', paddingTop: 12 }}
          formatter={(value: string) => value === 'attendus' ? 'Attendus' : 'Reçus'}
        />
        <Bar dataKey="attendus" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="recus" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add components/dashboard/revenus-chart.tsx
git commit -m "feat: graphique revenus 6 mois Recharts"
```

---

## Task 6 : Générateur de bail PDF (droit sénégalais loi 77-60)

**Files:**
- Create: `components/pdf/bail-doc.tsx`
- Create: `app/api/bail/[leaseId]/route.ts`
- Modify: `app/dashboard/locataires/[id]/page.tsx`

- [ ] **Step 1 : Créer components/pdf/bail-doc.tsx**

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface BailDocProps {
  agency: {
    name: string
    city: string | null
    country: string | null
    phone: string | null
    email: string | null
  }
  tenant: {
    full_name: string
    phone: string | null
    email: string | null
  }
  property: {
    title: string
    neighborhood: string | null
    city: string
    property_type: string | null
  } | null
  lease: {
    id: string
    start_date: string
    end_date: string
    monthly_rent: number
    deposit: number
  }
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmtFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingTop: 48,
    paddingBottom: 60,
    paddingLeft: 56,
    paddingRight: 56,
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#cccccc',
    marginVertical: 14,
  },
  articleTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 10,
  },
  articleBody: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  column: { flex: 1 },
  label: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  valueNormal: {
    fontSize: 10,
    marginBottom: 2,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  signatureBlock: {
    width: '40%',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 32,
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#333333',
    marginTop: 4,
  },
  signatureName: {
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
})

export default function BailDoc({ agency, tenant, property, lease }: BailDocProps) {
  const shortId = lease.id.slice(0, 8).toUpperCase()
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const durationMonths = Math.round(
    (new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / (30.44 * 86_400_000)
  )
  const propertyDesc = [property?.title, property?.neighborhood, property?.city].filter(Boolean).join(', ')
  const propertyType = property?.property_type ?? 'bien'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <Text style={styles.title}>CONTRAT DE BAIL</Text>
        <Text style={styles.subtitle}>
          Établi conformément à la loi n° 77-60 du 22 juin 1977 portant statut des baux à usage d'habitation
          et à usage professionnel au Sénégal — Réf. {shortId}
        </Text>

        <View style={styles.divider} />

        {/* Parties */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.label}>Le Bailleur (représenté par)</Text>
            <Text style={styles.value}>{agency.name}</Text>
            {agency.city ? <Text style={styles.valueNormal}>{[agency.city, agency.country].filter(Boolean).join(', ')}</Text> : null}
            {agency.phone ? <Text style={styles.valueNormal}>{agency.phone}</Text> : null}
            {agency.email ? <Text style={styles.valueNormal}>{agency.email}</Text> : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Le Locataire</Text>
            <Text style={styles.value}>{tenant.full_name}</Text>
            {tenant.phone ? <Text style={styles.valueNormal}>{tenant.phone}</Text> : null}
            {tenant.email ? <Text style={styles.valueNormal}>{tenant.email}</Text> : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Article 1 */}
        <Text style={styles.articleTitle}>Article 1 — Désignation du bien loué</Text>
        <Text style={styles.articleBody}>
          Le bailleur donne à bail au locataire, qui accepte, le {propertyType} sis à {propertyDesc || 'adresse à préciser'}.
          Le bien est loué pour usage d'habitation exclusive, conformément à l'article 7 de la loi n° 77-60.
        </Text>

        {/* Article 2 */}
        <Text style={styles.articleTitle}>Article 2 — Durée du bail</Text>
        <Text style={styles.articleBody}>
          Le présent bail est consenti et accepté pour une durée de {durationMonths} mois,
          prenant effet le {fmt(lease.start_date)} et se terminant le {fmt(lease.end_date)}.
          À l'expiration de ce terme, le bail sera reconduit tacitement par période d'un an, sauf congé donné
          par l'une des parties avec un préavis de trois (3) mois par lettre recommandée.
        </Text>

        {/* Article 3 */}
        <Text style={styles.articleTitle}>Article 3 — Loyer et modalités de paiement</Text>
        <Text style={styles.articleBody}>
          Le loyer mensuel est fixé à {fmtFCFA(lease.monthly_rent)}, payable d'avance le premier de chaque mois.
          Tout retard de paiement de plus de quinze (15) jours entraînera une pénalité de 10% du loyer mensuel,
          conformément aux dispositions légales en vigueur. Le bailleur délivrera une quittance de loyer
          à chaque paiement.
        </Text>

        {/* Article 4 */}
        <Text style={styles.articleTitle}>Article 4 — Dépôt de garantie</Text>
        <Text style={styles.articleBody}>
          {lease.deposit > 0
            ? `Le locataire versera, à la signature des présentes, un dépôt de garantie de ${fmtFCFA(lease.deposit)}, équivalant à ${Math.round(lease.deposit / lease.monthly_rent)} mois de loyer. Cette somme sera restituée dans un délai de deux (2) mois suivant la restitution des clés, déduction faite des sommes dues au titre des dégradations éventuelles constatées à l'état des lieux de sortie.`
            : 'Aucun dépôt de garantie n\'est exigé dans le cadre du présent bail.'}
        </Text>

        {/* Article 5 */}
        <Text style={styles.articleTitle}>Article 5 — Obligations du locataire</Text>
        <Text style={styles.articleBody}>
          Le locataire s'engage à : (1) payer le loyer aux termes convenus ; (2) user paisiblement du bien loué
          conformément à sa destination ; (3) ne pas effectuer de travaux de transformation sans accord écrit du
          bailleur ; (4) permettre au bailleur d'effectuer les réparations urgentes ; (5) prendre en charge les
          menues réparations d'entretien courant ; (6) ne pas sous-louer sans accord écrit préalable.
        </Text>

        {/* Article 6 */}
        <Text style={styles.articleTitle}>Article 6 — Obligations du bailleur</Text>
        <Text style={styles.articleBody}>
          Le bailleur s'engage à : (1) délivrer le bien en bon état d'usage ; (2) assurer la jouissance paisible
          du bien ; (3) entretenir le bien en état de servir à l'usage pour lequel il a été loué ;
          (4) effectuer les réparations autres que locatives.
        </Text>

        {/* Article 7 */}
        <Text style={styles.articleTitle}>Article 7 — Résiliation</Text>
        <Text style={styles.articleBody}>
          En cas de non-paiement du loyer à l'échéance, le bailleur pourra, après mise en demeure restée sans
          effet pendant quinze (15) jours, résilier le présent bail de plein droit. La résiliation ne pourra
          être prononcée que par décision judiciaire conformément aux articles 28 et suivants de la loi n° 77-60.
          Tout litige sera soumis à la juridiction compétente du lieu de situation du bien.
        </Text>

        <View style={styles.divider} />

        {/* Signatures */}
        <Text style={[styles.articleBody, { marginBottom: 0 }]}>
          Fait à {agency.city ?? 'Dakar'}, le {today}, en deux (2) exemplaires originaux.
        </Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Le Bailleur</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{agency.name}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Le Locataire</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{tenant.full_name}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré le {today} — Réf. {shortId} — ImmoDesk
          </Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2 : Créer app/api/bail/[leaseId]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import BailDoc from '@/components/pdf/bail-doc'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  const { leaseId } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('leases')
    .select(`
      id,
      start_date,
      end_date,
      monthly_rent,
      deposit,
      tenant:tenant_id(full_name, phone, email),
      property:property_id(title, neighborhood, city, property_type),
      agency:agency_id(name, city, country, phone, email)
    `)
    .eq('id', leaseId)
    .single()

  if (!raw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  type AgencyJoined = { name: string; city: string | null; country: string | null; phone: string | null; email: string | null } | null
  type TenantJoined = { full_name: string; phone: string | null; email: string | null } | null
  type PropertyJoined = { title: string; neighborhood: string | null; city: string; property_type: string | null } | null

  const agency = raw.agency as AgencyJoined
  const tenant = raw.tenant as TenantJoined
  const property = raw.property as PropertyJoined

  if (!tenant) {
    return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 })
  }

  const props = {
    agency: {
      name: agency?.name ?? 'Agence Immobilière',
      city: agency?.city ?? null,
      country: agency?.country ?? null,
      phone: agency?.phone ?? null,
      email: agency?.email ?? null,
    },
    tenant: {
      full_name: tenant.full_name,
      phone: tenant.phone ?? null,
      email: tenant.email ?? null,
    },
    property: property
      ? {
          title: property.title,
          neighborhood: property.neighborhood ?? null,
          city: property.city,
          property_type: property.property_type ?? null,
        }
      : null,
    lease: {
      id: String(raw.id),
      start_date: String(raw.start_date),
      end_date: String(raw.end_date),
      monthly_rent: Number(raw.monthly_rent),
      deposit: Number(raw.deposit ?? 0),
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buffer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(BailDoc, props) as any
    buffer = await renderToBuffer(element)
  } catch (err) {
    console.error('Bail PDF generation error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bail-${leaseId.slice(0, 8)}.pdf"`,
    },
  })
}
```

- [ ] **Step 3 : Ajouter le bouton "Bail PDF" dans la fiche locataire**

Dans `app/dashboard/locataires/[id]/page.tsx`, dans la carte "Contrat actif" (card du bail), ajouter le lien PDF après le bloc de détails, avant la balise fermante `</div>` de la carte :

```tsx
{/* Bail PDF */}
<div className="pt-2 border-t border-white/[0.07] mt-1">
  <a
    href={`/api/bail/${lease.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 w-full px-3 py-2 bg-white/[0.04] hover:bg-white/[0.07] text-[#888] hover:text-white text-xs font-medium rounded-xl transition border border-white/[0.08]"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    Générer le bail PDF
  </a>
</div>
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add components/pdf/bail-doc.tsx app/api/bail/[leaseId]/route.ts app/dashboard/locataires/[id]/page.tsx
git commit -m "feat: bail PDF loi 77-60 — génération contrat de location sénégalais"
```

---

## Task 7 : Gestion documents réelle (Supabase Storage)

**Files:**
- Rewrite: `app/dashboard/documents/page.tsx`
- Create: `components/dashboard/upload-document-modal.tsx`
- Create: `app/dashboard/documents/actions.ts`

**Pré-requis :** Créer le bucket Supabase Storage `documents` (public) si absent. Vérifier via MCP :
```sql
SELECT name FROM storage.buckets WHERE name = 'documents';
```
Si absent, créer via l'outil `mcp__supabase__execute_sql` :
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT DO NOTHING;
```
Puis créer les policies Storage (même pattern que le bucket `inspections`) :
```sql
CREATE POLICY "docs_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "docs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "docs_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');
```

- [ ] **Step 1 : Créer app/dashboard/documents/actions.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDocument(documentId: string, storagePath: string) {
  const supabase = await createClient()

  // Remove from storage first
  await supabase.storage.from('documents').remove([storagePath])

  // Remove from DB
  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/documents')
}
```

- [ ] **Step 2 : Créer components/dashboard/upload-document-modal.tsx**

```typescript
'use client'

import { useState, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const CATEGORIES = [
  { value: 'contrat', label: 'Contrat' },
  { value: 'titre', label: 'Titre foncier' },
  { value: 'mandat', label: 'Mandat' },
  { value: 'bail', label: 'Bail' },
  { value: 'quittance', label: 'Quittance' },
  { value: 'etat_des_lieux', label: 'État des lieux' },
  { value: 'autres', label: 'Autres' },
]

export default function UploadDocumentModal({
  agencyId,
}: {
  agencyId: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    const file = (formData.get('file') as File)
    const name = (formData.get('name') as string).trim() || file.name
    const category = formData.get('category') as string

    if (!file || file.size === 0) {
      setError('Sélectionnez un fichier.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${agencyId}/${crypto.randomUUID()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })

      if (storageError) throw new Error(storageError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path)

      const { error: dbError } = await supabase.from('documents').insert({
        agency_id: agencyId,
        name,
        category,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type,
      })

      if (dbError) {
        await supabase.storage.from('documents').remove([path])
        throw new Error(dbError.message)
      }

      setOpen(false)
      form.reset()
      // Force page refresh to show new document
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Importer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        >
          <div className="bg-[#161616] border border-white/[0.09] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 id="upload-modal-title" className="text-sm font-semibold text-white">Importer un document</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[#555] hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="doc-file" className="block text-xs text-[#666] mb-1.5">Fichier</label>
                <input
                  id="doc-file"
                  name="file"
                  type="file"
                  required
                  aria-required="true"
                  ref={fileRef}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#888] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="doc-name" className="block text-xs text-[#666] mb-1.5">Nom du document (optionnel)</label>
                <input
                  id="doc-name"
                  name="name"
                  type="text"
                  placeholder="Laissez vide pour utiliser le nom du fichier"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#3ECF8E]/50"
                />
              </div>

              <div>
                <label htmlFor="doc-category" className="block text-xs text-[#666] mb-1.5">Catégorie</label>
                <select
                  id="doc-category"
                  name="category"
                  defaultValue="autres"
                  required
                  aria-required="true"
                  className="w-full bg-[#1f1f1f] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-[#666] hover:text-white border border-white/[0.08] rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  aria-busy={uploading}
                  className="flex-1 px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition"
                >
                  {uploading ? 'Upload...' : 'Importer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3 : Réécrire app/dashboard/documents/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Document, DocumentCategory } from '@/lib/types'
import UploadDocumentModal from '@/components/dashboard/upload-document-modal'
import DeleteDocumentButton from '@/components/dashboard/delete-document-button'
import Link from 'next/link'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contrat: 'Contrat',
  titre: 'Titre',
  mandat: 'Mandat',
  bail: 'Bail',
  quittance: 'Quittance',
  etat_des_lieux: 'État des lieux',
  autres: 'Autres',
}

const FILTER_OPTIONS = [
  { value: 'tous', label: 'Tous' },
  { value: 'contrat', label: 'Contrats' },
  { value: 'titre', label: 'Titres' },
  { value: 'mandat', label: 'Mandats' },
  { value: 'bail', label: 'Baux' },
  { value: 'autres', label: 'Autres' },
] as const

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} Mo`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} Ko`
  return `${bytes} o`
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const { filtre = 'tous' } = await searchParams
  const supabase = await createClient()

  // Get agency_id for the upload modal
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .single()

  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (filtre !== 'tous') {
    query = query.eq('category', filtre)
  }

  const { data: docs } = await query

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <p className="text-sm text-[#888]">{(docs ?? []).length} document{(docs ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        {profile?.agency_id && (
          <UploadDocumentModal agencyId={profile.agency_id} />
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/documents?filtre=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              filtre === opt.value
                ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30'
                : 'text-[#888] hover:text-white border-white/[0.08] hover:border-white/20'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.05]">
          {(docs ?? []).length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">
                {filtre !== 'tous' ? 'Aucun document pour cette catégorie' : 'Aucun document importé'}
              </p>
              <p className="text-xs text-[#444] mt-1">
                {filtre === 'tous' ? 'Cliquez sur "Importer" pour ajouter un document' : ''}
              </p>
            </div>
          ) : (
            (docs as Document[]).map((doc) => {
              const isPdf = doc.mime_type === 'application/pdf' || doc.name.endsWith('.pdf')
              const supabaseUrl = supabase.storage.from('documents').getPublicUrl(doc.storage_path).data.publicUrl

              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-500/10 border border-red-500/10' : 'bg-blue-500/10 border border-blue-500/10'}`}>
                    <svg className={`w-4 h-4 ${isPdf ? 'text-red-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <p className="text-xs text-[#666] mt-0.5">
                      <span className="text-[#555] mr-2">{CATEGORY_LABELS[doc.category as DocumentCategory] ?? doc.category}</span>
                      {formatSize(doc.size_bytes)} · {formatDate(doc.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <a
                      href={supabaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Voir le document"
                      className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <a
                      href={supabaseUrl}
                      download={doc.name}
                      aria-label="Télécharger"
                      className="p-1.5 text-[#555] hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <DeleteDocumentButton documentId={doc.id} storagePath={doc.storage_path} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Créer components/dashboard/delete-document-button.tsx**

Le composant `DeleteDocumentButton` est référencé dans la page mais doit être créé :

```typescript
'use client'

import { useState, useTransition } from 'react'
import { deleteDocument } from '@/app/dashboard/documents/actions'

export default function DeleteDocumentButton({
  documentId,
  storagePath,
}: {
  documentId: string
  storagePath: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('Supprimer ce document définitivement ?')) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteDocument(documentId, storagePath)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Supprimer"
        aria-busy={isPending}
        className="p-1.5 text-[#555] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-400">{error}</span>
      )}
    </>
  )
}
```

- [ ] **Step 5 : Créer le bucket Supabase Storage documents + policies**

Via MCP `mcp__supabase__execute_sql` :

```sql
-- Créer bucket si absent
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'docs_insert' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "docs_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'docs_select' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "docs_select" ON storage.objects
      FOR SELECT USING (bucket_id = 'documents');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'docs_delete' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "docs_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'documents');
  END IF;
END $$;
```

- [ ] **Step 6 : Vérifier TypeScript**

```bash
cd /Users/toure/immodesk && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur.

- [ ] **Step 7 : Commit**

```bash
git add app/dashboard/documents/ components/dashboard/upload-document-modal.tsx components/dashboard/delete-document-button.tsx
git commit -m "feat: gestion documents réelle — upload Supabase Storage, filtres, suppression"
```

---

## Self-Review

**Couverture spec :**
1. Paiements FCFA (Orange Money/Wave/espèces) — Tasks 2 + 3 ✓
2. WhatsApp relances — Task 4 (section impayés avec liens wa.me + templates en français) ✓
3. Bail PDF loi 77-60 — Task 6 ✓
4. Dashboard loyers (attendus/reçus, top impayés, graphique 6 mois) — Tasks 4 + 5 ✓
5. Gestion documents Supabase Storage — Task 7 ✓

**Pas de placeholders** — chaque step contient le code complet.

**Cohérence types :**
- `PaymentMethod` défini en Task 1, utilisé dans Tasks 2, 3
- `Document` / `DocumentCategory` définis en Task 1, utilisés en Task 7
- `QuittanceProps.payment.payment_method` aligné entre `quittance-doc.tsx` et `route.ts` (Task 3)
- `BailDocProps` défini dans `bail-doc.tsx`, consommé par `route.ts` (Task 6)

**Dépendances :**
- Task 1 (migration) doit passer avant Tasks 2, 3, 7
- Task 4 doit passer avant Task 5 (RevenusChart importé dans loyers/page.tsx)
- Tasks 6 et 7 sont indépendantes entre elles
