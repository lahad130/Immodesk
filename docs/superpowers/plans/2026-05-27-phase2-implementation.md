# ImmoDesk Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le module taux d'occupation, la gestion locataires/paiements/incidents, les inspections avec rapport PDF, et corriger le bug "Bien non défini" dans les visites.

**Architecture:** Approche B — une seule migration Supabase crée les 5 nouvelles tables (tenants, leases, payments, inspections, incidents) avec RLS, puis livraison par ordre de valeur : bug fix → occupation → locataires → inspections. Les PDF sont générés via `@react-pdf/renderer` dans des Route Handlers Next.js. Les graphiques utilisent Recharts dans des Client Components.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, Supabase (MCP), Tailwind CSS v4, Recharts, @react-pdf/renderer

**Conventions critiques:**
- Pas d'emojis dans l'UI — icônes SVG inline uniquement
- Montants toujours en FCFA via `formatFCFA()` de `lib/format.ts`
- Thème : bg `#0f0f0f`, vert `#3ECF8E`, cards `#171717`, bordures `rgba(255,255,255,0.08)`
- Next.js 16 : middleware = `proxy.ts` (export `proxy`), env var = `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Avant tout changement Next.js : lire `node_modules/next/dist/docs/` si comportement incertain

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `next.config.ts` | Modifier | serverExternalPackages pour @react-pdf/renderer |
| `lib/types.ts` | Modifier | Ajouter Tenant, Lease, Payment, Inspection, Incident |
| `lib/format.ts` | Créer | formatFCFA, formatDate partagés |
| `supabase/migrations/20260527000000_phase2.sql` | Créer | SQL de référence (appliquer via MCP) |
| `app/dashboard/page.tsx` | Modifier | Fix fallback "Bien non défini" / "Client inconnu" |
| `app/dashboard/visits/page.tsx` | Modifier | Fix même fallback |
| `components/dashboard/sidebar.tsx` | Modifier | Section "Location" avec 3 nouvelles entrées |
| `components/dashboard/occupation-chart.tsx` | Créer | BarChart Recharts (Client Component) |
| `app/dashboard/occupation/page.tsx` | Créer | Page taux d'occupation (Server Component) |
| `app/dashboard/locataires/page.tsx` | Créer | Liste locataires (Server Component) |
| `app/dashboard/locataires/[id]/page.tsx` | Créer | Détail locataire (Server Component) |
| `components/pdf/quittance-doc.tsx` | Créer | Layout PDF quittance (@react-pdf/renderer) |
| `app/api/quittance/[paymentId]/route.ts` | Créer | Route Handler PDF quittance |
| `components/dashboard/inspection-form.tsx` | Créer | Formulaire inspection avec upload photos (Client Component) |
| `app/dashboard/inspections/page.tsx` | Créer | Liste inspections (Server Component) |
| `app/dashboard/inspections/new/page.tsx` | Créer | Page formulaire nouvelle inspection |
| `app/dashboard/inspections/new/actions.ts` | Créer | Server Action création inspection |
| `app/dashboard/inspections/[id]/page.tsx` | Créer | Détail inspection (Server Component) |
| `components/pdf/inspection-doc.tsx` | Créer | Layout PDF rapport (@react-pdf/renderer) |
| `app/api/inspection-report/[id]/route.ts` | Créer | Route Handler PDF rapport inspection |

---

## Task 1 : Installer les dépendances + mettre à jour next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Étape 1 : Installer recharts et @react-pdf/renderer**

```bash
npm install recharts @react-pdf/renderer
npm install --save-dev @types/recharts
```

- [ ] **Étape 2 : Mettre à jour next.config.ts**

`@react-pdf/renderer` doit être exclu du bundling côté serveur pour éviter les erreurs de build.

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
```

- [ ] **Étape 3 : Vérifier que le serveur démarre sans erreur**

```bash
npm run dev
```

Attendu : serveur démarre sur `http://localhost:3000` sans erreur de compilation.

- [ ] **Étape 4 : Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "chore: add recharts and @react-pdf/renderer"
```

---

## Task 2 : Migration Supabase — 5 nouvelles tables

**Files:**
- Créer: `supabase/migrations/20260527000000_phase2.sql` (référence locale)
- Appliquer via MCP `apply_migration`

- [ ] **Étape 1 : Créer le répertoire et le fichier SQL de référence**

```bash
mkdir -p supabase/migrations
```

Créer `supabase/migrations/20260527000000_phase2.sql` :

```sql
-- Locataires
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Contrats de location
CREATE TABLE leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent bigint NOT NULL,
  deposit bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'actif'
    CHECK (status = ANY (ARRAY['actif','expire','resilie'])),
  created_at timestamptz DEFAULT now()
);

-- Paiements
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid REFERENCES leases(id) ON DELETE CASCADE NOT NULL,
  amount_fcfa bigint NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'en_attente'
    CHECK (status = ANY (ARRAY['paye','en_attente','retard'])),
  created_at timestamptz DEFAULT now()
);

-- Inspections / états des lieux
CREATE TABLE inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['entree','sortie'])),
  inspection_date date NOT NULL,
  notes text,
  photos text[] DEFAULT '{}',
  report_url text,
  created_at timestamptz DEFAULT now()
);

-- Incidents signalés
CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ouvert'
    CHECK (status = ANY (ARRAY['ouvert','en_cours','resolu'])),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_tenants" ON tenants
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "agency_leases" ON leases
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "agency_payments" ON payments
  FOR ALL USING (
    lease_id IN (
      SELECT id FROM leases
      WHERE agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "agency_inspections" ON inspections
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "agency_incidents" ON incidents
  FOR ALL USING (
    agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );
```

- [ ] **Étape 2 : Appliquer la migration via Supabase MCP**

Utiliser l'outil MCP `apply_migration` avec le nom `phase2_rental_tables` et le contenu SQL ci-dessus.

- [ ] **Étape 3 : Créer le bucket Storage pour les photos d'inspection**

Dans le dashboard Supabase → Storage → New bucket :
- Nom : `inspections`
- Public : oui (pour que les URLs soient accessibles via WhatsApp)

- [ ] **Étape 4 : Vérifier les tables en base**

Utiliser `list_tables` MCP pour confirmer que les 5 tables existent avec le bon schéma.

- [ ] **Étape 5 : Commit**

```bash
git add supabase/
git commit -m "feat: migration phase 2 — tenants, leases, payments, inspections, incidents"
```

---

## Task 3 : Mettre à jour les types TypeScript

**Files:**
- Modify: `lib/types.ts`

- [ ] **Étape 1 : Ajouter les 5 nouveaux types en fin de fichier**

Ajouter à la fin de `lib/types.ts` :

```ts
export type LeaseStatus = 'actif' | 'expire' | 'resilie'
export type PaymentStatus = 'paye' | 'en_attente' | 'retard'
export type InspectionType = 'entree' | 'sortie'
export type IncidentStatus = 'ouvert' | 'en_cours' | 'resolu'

export interface Tenant {
  id: string
  agency_id: string
  full_name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  created_at: string
}

export interface Lease {
  id: string
  agency_id: string
  property_id: string | null
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit: number
  status: LeaseStatus
  created_at: string
  // joined
  tenant?: Tenant | null
  property?: Property | null
}

export interface Payment {
  id: string
  lease_id: string
  amount_fcfa: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  created_at: string
  // joined
  lease?: Lease | null
}

export interface Inspection {
  id: string
  agency_id: string
  property_id: string | null
  lease_id: string | null
  type: InspectionType
  inspection_date: string
  notes: string | null
  photos: string[]
  report_url: string | null
  created_at: string
  // joined
  property?: Property | null
  lease?: Lease | null
}

export interface Incident {
  id: string
  agency_id: string
  property_id: string | null
  lease_id: string | null
  title: string
  description: string | null
  status: IncidentStatus
  created_at: string
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Attendu : 0 erreurs.

- [ ] **Étape 3 : Commit**

```bash
git add lib/types.ts
git commit -m "feat: types Tenant, Lease, Payment, Inspection, Incident"
```

---

## Task 4 : Créer l'utilitaire de formatage partagé

**Files:**
- Créer: `lib/format.ts`

- [ ] **Étape 1 : Créer `lib/format.ts`**

```ts
export function formatFCFA(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Md FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}

export function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysLate(dueDateStr: string): number {
  const diff = Date.now() - new Date(dueDateStr).getTime()
  return Math.floor(diff / 86_400_000)
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Attendu : 0 erreurs.

- [ ] **Étape 3 : Commit**

```bash
git add lib/format.ts
git commit -m "feat: utilitaires formatFCFA, formatDate, daysLate"
```

---

## Task 5 : Fix bug "Bien non défini / Client inconnu"

**Files:**
- Modify: `app/dashboard/page.tsx` lignes 168-180
- Modify: `app/dashboard/visits/page.tsx` lignes 43-48

- [ ] **Étape 1 : Corriger les données seed via Supabase MCP**

Utiliser `execute_sql` MCP pour patcher les visites qui ont des FK nulles :

```sql
-- Associer un bien existant aux visites sans property_id
UPDATE visits
SET property_id = (
  SELECT id FROM properties
  WHERE agency_id = visits.agency_id
  ORDER BY created_at
  LIMIT 1
)
WHERE property_id IS NULL;

-- Associer un lead existant aux visites sans lead_id
UPDATE visits
SET lead_id = (
  SELECT id FROM leads
  WHERE agency_id = visits.agency_id
  ORDER BY created_at
  LIMIT 1
)
WHERE lead_id IS NULL;
```

Vérifier : `SELECT COUNT(*) FROM visits WHERE property_id IS NULL OR lead_id IS NULL` → doit retourner 0.

- [ ] **Étape 2 : Améliorer le fallback dans `app/dashboard/page.tsx`**

Trouver le bloc "Prochaines visites" (lignes ~168-180) et remplacer :

```tsx
// AVANT
<p className="text-xs font-medium text-white truncate">
  {visit.property?.title ?? 'Bien non défini'}
</p>
<p className="text-xs text-[#666] mt-0.5 truncate">
  {visit.lead?.full_name ?? 'Client inconnu'}
</p>

// APRÈS
<p className="text-xs font-medium text-white truncate">
  {visit.property?.title ?? <span className="text-[#555]">Non assigné</span>}
</p>
<p className="text-xs text-[#666] mt-0.5 truncate">
  {visit.lead?.full_name ?? '—'}
</p>
```

- [ ] **Étape 3 : Même correction dans `app/dashboard/visits/page.tsx`**

Trouver les lignes ~43-48 dans `VisitRow` et remplacer :

```tsx
// AVANT
<p className="text-sm font-medium text-white truncate">
  {(visit as { property?: { title: string } | null }).property?.title ?? 'Bien non défini'}
</p>
<p className="text-xs text-[#666] truncate">
  {(visit as { lead?: { full_name: string; phone?: string } | null }).lead?.full_name ?? 'Client inconnu'}
  ...
</p>

// APRÈS
<p className="text-sm font-medium text-white truncate">
  {(visit as { property?: { title: string } | null }).property?.title ?? <span className="text-[#555]">Non assigné</span>}
</p>
<p className="text-xs text-[#666] truncate">
  {(visit as { lead?: { full_name: string; phone?: string } | null }).lead?.full_name ?? '—'}
  {(visit as { lead?: { phone?: string } | null }).lead?.phone && ` · ${(visit as { lead: { phone: string } }).lead.phone}`}
</p>
```

- [ ] **Étape 4 : Vérifier dans le navigateur**

```bash
npm run dev
```

Ouvrir `http://localhost:3000/dashboard` et `http://localhost:3000/dashboard/visits`. Les visites doivent afficher les vrais noms de biens et clients. Plus aucun "Bien non défini" ni "Client inconnu".

- [ ] **Étape 5 : Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/visits/page.tsx
git commit -m "fix: fallback visites — remplacer 'Bien non défini' par 'Non assigné'"
```

---

## Task 6 : Composant graphique d'occupation (Recharts)

**Files:**
- Créer: `components/dashboard/occupation-chart.tsx`

- [ ] **Étape 1 : Créer `components/dashboard/occupation-chart.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartPoint {
  month: string
  rate: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs">
      <p className="text-[#888] mb-0.5">{label}</p>
      <p className="text-[#3ECF8E] font-semibold">{payload[0].value}% occupé</p>
    </div>
  )
}

export default function OccupationChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="month"
          stroke="#444"
          tick={{ fill: '#666', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#444"
          tick={{ fill: '#666', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="rate" fill="#3ECF8E" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Étape 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```

Attendu : 0 erreurs.

- [ ] **Étape 3 : Commit**

```bash
git add components/dashboard/occupation-chart.tsx
git commit -m "feat: composant OccupationChart Recharts"
```

---

## Task 7 : Page Taux d'occupation

**Files:**
- Créer: `app/dashboard/occupation/page.tsx`

- [ ] **Étape 1 : Créer `app/dashboard/occupation/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import OccupationChart from '@/components/dashboard/occupation-chart'
import type { Lease, Payment, Property } from '@/lib/types'

function buildChartData(
  leases: Pick<Lease, 'start_date' | 'end_date'>[],
  totalRental: number
) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const active = leases.filter((l) => {
      const start = new Date(l.start_date)
      const end = new Date(l.end_date)
      return start <= monthEnd && end >= d
    }).length
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      rate: totalRental > 0 ? Math.round((active / totalRental) * 100) : 0,
    }
  })
}

export default async function OccupationPage() {
  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const [
    { data: rentalProperties },
    { data: activeLeases },
    { data: allLeases },
    { data: latePayments },
  ] = await Promise.all([
    supabase.from('properties').select('id, title, neighborhood, city, status').eq('transaction_type', 'location'),
    supabase.from('leases').select('*, tenant:tenant_id(full_name, whatsapp), property:property_id(title)').eq('status', 'actif'),
    supabase.from('leases').select('start_date, end_date'),
    supabase
      .from('payments')
      .select('*, lease:lease_id(monthly_rent, tenant:tenant_id(full_name, whatsapp), property:property_id(title))')
      .eq('status', 'retard'),
  ])

  const totalRental = rentalProperties?.length ?? 0
  const rented = rentalProperties?.filter((p) => p.status === 'loue').length ?? 0
  const occupationRate = totalRental > 0 ? Math.round((rented / totalRental) * 100) : 0

  // Revenus ce mois
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount_fcfa, status, due_date')
    .gte('due_date', startOfMonth)
    .lte('due_date', endOfMonth)

  const encaisse = (monthPayments ?? []).filter((p) => p.status === 'paye').reduce((s, p) => s + (p.amount_fcfa ?? 0), 0)
  const attendu = (activeLeases ?? []).reduce((s, l) => s + (l.monthly_rent ?? 0), 0)

  const chartData = buildChartData(allLeases ?? [], totalRental)

  type LatePaymentRow = Payment & {
    lease?: {
      monthly_rent: number
      tenant?: { full_name: string; whatsapp: string | null } | null
      property?: { title: string } | null
    } | null
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Taux d&apos;occupation</h2>
        <p className="text-sm text-[#888] mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Taux d'occupation", value: `${occupationRate}%`, sub: `${rented} biens loués / ${totalRental}`, positive: occupationRate >= 70 },
          { label: 'Biens en location', value: `${rented} / ${totalRental}`, sub: `${totalRental - rented} disponibles`, positive: true },
          { label: 'Revenus encaissés', value: formatFCFA(encaisse), sub: 'Ce mois', positive: true },
          { label: 'Revenus attendus', value: formatFCFA(attendu), sub: encaisse < attendu ? `Écart : ${formatFCFA(attendu - encaisse)}` : 'Objectif atteint', positive: encaisse >= attendu },
        ].map((m) => (
          <div key={m.label} className="bg-[#171717] border border-white/[0.08] rounded-2xl p-4 lg:p-5">
            <p className="text-2xl font-bold text-white mb-1">{m.value}</p>
            <p className="text-xs text-[#666]">{m.label}</p>
            <p className={`text-xs mt-1 font-medium ${m.positive ? 'text-[#3ECF8E]' : 'text-red-400'}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphique 6 mois */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Occupation sur 6 mois</h3>
        <OccupationChart data={chartData} />
      </div>

      {/* Retards de paiement */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">
            Retards de paiement
            {(latePayments?.length ?? 0) > 0 && (
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                {latePayments!.length}
              </span>
            )}
          </h3>
        </div>
        {!latePayments?.length ? (
          <p className="px-5 py-8 text-sm text-[#555] text-center">Aucun retard de paiement</p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {(latePayments as LatePaymentRow[]).map((p) => {
              const daysLate = Math.floor((Date.now() - new Date(p.due_date).getTime()) / 86_400_000)
              const phone = p.lease?.tenant?.whatsapp ?? ''
              const msg = encodeURIComponent(
                `Bonjour ${p.lease?.tenant?.full_name ?? ''}, votre loyer de ${formatFCFA(p.amount_fcfa)} pour ${p.lease?.property?.title ?? 'votre bien'} est en retard de ${daysLate} jour(s). Merci de régulariser.`
              )
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.lease?.tenant?.full_name ?? '—'}</p>
                    <p className="text-xs text-[#666] truncate">{p.lease?.property?.title ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-400">{formatFCFA(p.amount_fcfa)}</p>
                    <p className="text-xs text-[#555]">{daysLate}j de retard</p>
                  </div>
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold rounded-lg transition"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Statut des biens en location */}
      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h3 className="text-sm font-semibold text-white">Biens en location</h3>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(rentalProperties as Property[] ?? []).map((prop) => {
            const lease = (activeLeases ?? []).find((l) => l.property_id === prop.id)
            const endDate = lease ? new Date(lease.end_date) : null
            const daysToEnd = endDate ? Math.floor((endDate.getTime() - Date.now()) / 86_400_000) : null
            const expiringSoon = daysToEnd !== null && daysToEnd <= 30 && daysToEnd >= 0
            return (
              <div key={prop.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{prop.title}</p>
                  <p className="text-xs text-[#666] truncate">
                    {prop.neighborhood ? `${prop.neighborhood}, ` : ''}{prop.city}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {prop.status === 'loue' && lease ? (
                    <>
                      <p className="text-xs font-medium text-white truncate max-w-[120px]">
                        {(lease as Lease & { tenant?: { full_name: string } | null }).tenant?.full_name ?? '—'}
                      </p>
                      <p className={`text-xs ${expiringSoon ? 'text-orange-400' : 'text-[#555]'}`}>
                        {expiringSoon ? `Expire dans ${daysToEnd}j` : endDate ? `Fin ${endDate.toLocaleDateString('fr-FR')}` : '—'}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-[#3ECF8E]">Disponible</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier dans le navigateur**

```bash
npm run dev
```

Ouvrir `http://localhost:3000/dashboard/occupation`. La page doit s'afficher avec les 4 KPIs, le graphique (vide si pas de données), et les sections de retards/biens.

- [ ] **Étape 3 : Commit**

```bash
git add app/dashboard/occupation/page.tsx
git commit -m "feat: page taux d'occupation avec KPIs, graphique 6 mois, retards"
```

---

## Task 8 : Mise à jour de la sidebar

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Étape 1 : Insérer les 3 nouvelles entrées dans `nav` (après l'entrée `visits`, avant `ai-agent`)**

Dans `components/dashboard/sidebar.tsx`, trouver le bloc `visits` (lignes ~38-44) qui se termine par `},` et insérer les 3 objets suivants juste après, avant l'entrée `ai-agent` :

```ts
  // Insérer ces 3 entrées après la fermeture },  de l'entrée visits :
  {
    href: '/dashboard/occupation',
    label: 'Occupation',
    section: 'Location',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/locataires',
    label: 'Locataires',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/inspections',
    label: 'Inspections',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  // Les entrées ai-agent et documents existantes suivent, inchangées — ne pas les modifier
```

Le code JSX montré se termine après `inspections`. Ne rien changer aux entrées `ai-agent` et `documents` déjà présentes dans le fichier.


- [ ] **Étape 2 : Mettre à jour le type du tableau `nav` et le rendu**

Ajouter `section?: string` au type implicite, et dans la boucle `nav.map(...)`, afficher un séparateur + label quand `item.section` est défini :

```tsx
{nav.map((item, index) => {
  const active = isActive(item)
  const showSection = !collapsed && 'section' in item && item.section &&
    (index === 0 || !('section' in nav[index - 1]) || nav[index - 1].section !== item.section)
  return (
    <div key={item.href}>
      {showSection && (
        <div className="px-2.5 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-[#444] uppercase tracking-wider">
            {item.section}
          </p>
        </div>
      )}
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition group ${
          active
            ? 'bg-[#3ECF8E]/10 text-[#3ECF8E]'
            : 'text-[#888] hover:text-white hover:bg-white/5'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="flex-1 font-medium">{item.label}</span>}
        {!collapsed && 'badge' in item && item.badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#3ECF8E]/15 text-[#3ECF8E]">
            {item.badge}
          </span>
        )}
      </Link>
    </div>
  )
})}
```

- [ ] **Étape 3 : Vérifier dans le navigateur**

La sidebar doit afficher une section "Location" avec Occupation, Locataires, Inspections. Les liens doivent être actifs selon la route courante.

- [ ] **Étape 4 : Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat: sidebar section Location — Occupation, Locataires, Inspections"
```

---

## Task 9 : Page liste locataires

**Files:**
- Créer: `app/dashboard/locataires/page.tsx`

- [ ] **Étape 1 : Créer `app/dashboard/locataires/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { formatFCFA } from '@/lib/format'
import type { Tenant, Lease } from '@/lib/types'
import Link from 'next/link'

const paymentStatusConfig = {
  paye: { label: 'Payé', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  en_attente: { label: 'En attente', className: 'text-orange-400 bg-orange-500/10' },
  retard: { label: 'Retard', className: 'text-red-400 bg-red-500/10' },
} as const

export default async function LocatairesPage() {
  const supabase = await createClient()

  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      tenant:tenant_id(*),
      property:property_id(id, title, neighborhood, city)
    `)
    .eq('status', 'actif')
    .order('created_at', { ascending: false })

  // Récupérer le dernier paiement par bail
  const leaseIds = (leases ?? []).map((l) => l.id)
  const { data: lastPayments } = leaseIds.length
    ? await supabase
        .from('payments')
        .select('lease_id, status, due_date')
        .in('lease_id', leaseIds)
        .order('due_date', { ascending: false })
    : { data: [] }

  function lastPaymentStatus(leaseId: string): keyof typeof paymentStatusConfig {
    const p = (lastPayments ?? []).find((x) => x.lease_id === leaseId)
    return (p?.status as keyof typeof paymentStatusConfig) ?? 'en_attente'
  }

  type LeaseRow = Lease & {
    tenant: Tenant
    property: { id: string; title: string; neighborhood: string | null; city: string } | null
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Locataires</h2>
          <p className="text-sm text-[#888]">{leases?.length ?? 0} contrats actifs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau locataire
        </button>
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.07] text-xs text-[#555] font-semibold uppercase tracking-wide">
          <span>Locataire</span>
          <span>Bien</span>
          <span>Loyer / mois</span>
          <span>Fin contrat</span>
          <span>Paiement</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(leases as LeaseRow[] ?? []).map((lease) => {
            const status = lastPaymentStatus(lease.id)
            const sc = paymentStatusConfig[status]
            return (
              <Link
                key={lease.id}
                href={`/dashboard/locataires/${lease.id}`}
                className="grid sm:grid-cols-[1fr_1fr_120px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                    {lease.tenant.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lease.tenant.full_name}</p>
                    <p className="text-xs text-[#666] truncate">{lease.tenant.phone ?? '—'}</p>
                  </div>
                </div>
                <p className="text-sm text-[#888] truncate">
                  {lease.property?.title ?? <span className="text-[#555]">Non assigné</span>}
                </p>
                <p className="text-sm font-semibold text-[#3ECF8E]">{formatFCFA(lease.monthly_rent)}</p>
                <p className="text-xs text-[#666]">
                  {new Date(lease.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${sc.className}`}>{sc.label}</span>
              </Link>
            )
          })}
          {!leases?.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">Aucun locataire actif</p>
              <p className="text-xs text-[#444] mt-1">Créez un contrat de location pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier dans le navigateur**

`http://localhost:3000/dashboard/locataires` — liste vide si pas de données, ou avec les locataires en base.

- [ ] **Étape 3 : Commit**

```bash
git add app/dashboard/locataires/page.tsx
git commit -m "feat: page liste locataires avec statut paiement"
```

---

## Task 10 : Page détail locataire

**Files:**
- Créer: `app/dashboard/locataires/[id]/page.tsx`

- [ ] **Étape 1 : Créer `app/dashboard/locataires/[id]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/format'
import type { Lease, Payment, Incident } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const paymentStatusConfig = {
  paye: { label: 'Payé', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  en_attente: { label: 'En attente', className: 'text-orange-400 bg-orange-500/10' },
  retard: { label: 'Retard', className: 'text-red-400 bg-red-500/10' },
} as const

const incidentStatusConfig = {
  ouvert: { label: 'Ouvert', className: 'text-red-400 bg-red-500/10' },
  en_cours: { label: 'En cours', className: 'text-orange-400 bg-orange-500/10' },
  resolu: { label: 'Résolu', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
} as const

export default async function LocataireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lease } = await supabase
    .from('leases')
    .select('*, tenant:tenant_id(*), property:property_id(title, neighborhood, city, price)')
    .eq('id', id)
    .single()

  if (!lease) notFound()

  const [{ data: payments }, { data: incidents }] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('lease_id', id)
      .order('due_date', { ascending: false }),
    supabase
      .from('incidents')
      .select('*')
      .eq('lease_id', id)
      .order('created_at', { ascending: false }),
  ])

  type LeaseDetail = Lease & {
    tenant: { full_name: string; phone: string | null; whatsapp: string | null; email: string | null }
    property: { title: string; neighborhood: string | null; city: string; price: number } | null
  }

  const l = lease as LeaseDetail
  const waPhone = l.tenant.whatsapp?.replace(/\D/g, '') ?? l.tenant.phone?.replace(/\D/g, '') ?? ''

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/locataires" className="text-[#555] hover:text-white transition text-sm">
          ← Locataires
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Colonne gauche — infos + contrat */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info locataire */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
            <div className="w-12 h-12 rounded-2xl bg-[#1f1f1f] border border-white/10 flex items-center justify-center text-lg font-bold text-white mb-4">
              {l.tenant.full_name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-base font-semibold text-white mb-3">{l.tenant.full_name}</h2>
            <div className="space-y-2 text-sm">
              {l.tenant.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-[#555]">Téléphone</span>
                  <span className="text-[#ccc]">{l.tenant.phone}</span>
                </div>
              )}
              {l.tenant.email && (
                <div className="flex items-center justify-between">
                  <span className="text-[#555]">Email</span>
                  <span className="text-[#ccc] truncate max-w-[140px]">{l.tenant.email}</span>
                </div>
              )}
            </div>
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-sm font-semibold rounded-xl transition"
              >
                Contacter sur WhatsApp
              </a>
            )}
          </div>

          {/* Contrat */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Contrat actif</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[#555]">Bien</span>
                <span className="text-[#ccc] text-right truncate max-w-[150px]">{l.property?.title ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Début</span>
                <span className="text-[#ccc]">{formatDate(l.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Fin</span>
                <span className="text-[#ccc]">{formatDate(l.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Loyer</span>
                <span className="text-[#3ECF8E] font-semibold">{formatFCFA(l.monthly_rent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Caution</span>
                <span className="text-[#ccc]">{formatFCFA(l.deposit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite — paiements + incidents */}
        <div className="lg:col-span-2 space-y-4">
          {/* Historique paiements */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Historique des paiements</h3>
              <a
                href={`/api/quittance/${payments?.[0]?.id}`}
                target="_blank"
                className="text-xs text-[#3ECF8E] hover:text-[#3ECF8E]/80 transition"
              >
                Quittance PDF
              </a>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {(payments as Payment[] ?? []).map((p) => {
                const sc = paymentStatusConfig[p.status as keyof typeof paymentStatusConfig] ?? paymentStatusConfig.en_attente
                const waMsg = encodeURIComponent(
                  `Bonjour ${l.tenant.full_name}, voici votre quittance de ${formatFCFA(p.amount_fcfa)} pour ${l.property?.title ?? 'votre bien'} — période : ${formatDate(p.due_date)}.`
                )
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1">
                      <p className="text-sm text-white">{formatDate(p.due_date, { month: 'long', year: 'numeric' })}</p>
                      {p.paid_date && (
                        <p className="text-xs text-[#555]">Payé le {formatDate(p.paid_date)}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{formatFCFA(p.amount_fcfa)}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sc.className}`}>{sc.label}</span>
                    {p.status === 'paye' && waPhone && (
                      <a
                        href={`https://wa.me/${waPhone}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366]/20 transition"
                      >
                        Envoyer
                      </a>
                    )}
                  </div>
                )
              })}
              {!payments?.length && (
                <p className="px-5 py-6 text-sm text-[#555] text-center">Aucun paiement enregistré</p>
              )}
            </div>
          </div>

          {/* Incidents */}
          <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <h3 className="text-sm font-semibold text-white">Incidents</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {(incidents as Incident[] ?? []).map((inc) => {
                const sc = incidentStatusConfig[inc.status as keyof typeof incidentStatusConfig] ?? incidentStatusConfig.ouvert
                return (
                  <div key={inc.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{inc.title}</p>
                      {inc.description && <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{inc.description}</p>}
                      <p className="text-[10px] text-[#444] mt-1">{formatDate(inc.created_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${sc.className}`}>{sc.label}</span>
                  </div>
                )
              })}
              {!incidents?.length && (
                <p className="px-5 py-6 text-sm text-[#555] text-center">Aucun incident signalé</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier dans le navigateur**

Naviguer vers `/dashboard/locataires` → cliquer sur un locataire. La page détail doit s'ouvrir avec le contrat, les sections paiements et incidents vides si pas de données.

- [ ] **Étape 3 : Commit**

```bash
git add app/dashboard/locataires/
git commit -m "feat: page détail locataire — contrat, paiements, incidents, WhatsApp"
```

---

## Task 11 : Quittance PDF (Route Handler + document PDF)

**Files:**
- Créer: `components/pdf/quittance-doc.tsx`
- Créer: `app/api/quittance/[paymentId]/route.ts`

- [ ] **Étape 1 : Créer `components/pdf/quittance-doc.tsx`**

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 32, borderBottom: '2pt solid #3ECF8E', paddingBottom: 16 },
  agencyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#111111' },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 24, color: '#111111' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 10, color: '#666666' },
  value: { fontSize: 10, color: '#111111', fontFamily: 'Helvetica-Bold' },
  amount: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#111111', marginVertical: 24 },
  stamp: {
    marginTop: 32, padding: 12, borderRadius: 4,
    border: '2pt solid #3ECF8E', textAlign: 'center',
  },
  stampText: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#3ECF8E' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 8, color: '#aaaaaa' },
})

interface QuittanceProps {
  agencyName: string
  tenantName: string
  propertyTitle: string
  period: string
  amountFCFA: number
  status: 'paye' | 'en_attente' | 'retard'
  paidDate: string | null
}

function formatFCFA(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} 000 FCFA`
  return `${n} FCFA`
}

export function QuittanceDocument({ agencyName, tenantName, propertyTitle, period, amountFCFA, status, paidDate }: QuittanceProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agencyName}>{agencyName}</Text>
        </View>
        <Text style={styles.title}>Quittance de loyer</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Locataire</Text>
          <Text style={styles.value}>{tenantName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bien</Text>
          <Text style={styles.value}>{propertyTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Période</Text>
          <Text style={styles.value}>{period}</Text>
        </View>
        <Text style={styles.amount}>{formatFCFA(amountFCFA)}</Text>
        <View style={styles.stamp}>
          {status === 'paye' ? (
            <Text style={styles.stampText}>PAYÉ{paidDate ? ` le ${paidDate}` : ''}</Text>
          ) : (
            <Text style={[styles.stampText, { color: '#e53e3e' }]}>EN ATTENTE</Text>
          )}
        </View>
        <Text style={styles.footer}>
          Document généré automatiquement par ImmoDesk — {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Étape 2 : Créer `app/api/quittance/[paymentId]/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuittanceDocument } from '@/components/pdf/quittance-doc'
import { createElement } from 'react'

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params
  const supabase = await createClient()

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*, lease:lease_id(monthly_rent, tenant:tenant_id(full_name), property:property_id(title), agency:agency_id(name))')
    .eq('id', paymentId)
    .single()

  if (error || !payment) {
    return new Response('Paiement introuvable', { status: 404 })
  }

  const lease = payment.lease as {
    monthly_rent: number
    tenant: { full_name: string } | null
    property: { title: string } | null
    agency: { name: string } | null
  } | null

  const period = new Date(payment.due_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const paidDateFormatted = payment.paid_date
    ? new Date(payment.paid_date).toLocaleDateString('fr-FR')
    : null

  const buffer = await renderToBuffer(
    createElement(QuittanceDocument, {
      agencyName: lease?.agency?.name ?? 'Agence',
      tenantName: lease?.tenant?.full_name ?? '—',
      propertyTitle: lease?.property?.title ?? '—',
      period,
      amountFCFA: payment.amount_fcfa,
      status: payment.status as 'paye' | 'en_attente' | 'retard',
      paidDate: paidDateFormatted,
    })
  )

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quittance-${period.replace(' ', '-')}.pdf"`,
    },
  })
}
```

- [ ] **Étape 3 : Vérifier la compilation**

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -20
```

Si erreur `@react-pdf/renderer` non résolu côté serveur, vérifier que `serverExternalPackages` est bien dans `next.config.ts`.

- [ ] **Étape 4 : Tester le PDF**

Avec un `paymentId` valide en base : ouvrir `http://localhost:3000/api/quittance/<id>` dans le navigateur. Un PDF doit s'afficher.

- [ ] **Étape 5 : Commit**

```bash
git add components/pdf/quittance-doc.tsx app/api/quittance/
git commit -m "feat: quittance PDF via @react-pdf/renderer + Route Handler"
```

---

## Task 12 : Page liste inspections

**Files:**
- Créer: `app/dashboard/inspections/page.tsx`

- [ ] **Étape 1 : Créer `app/dashboard/inspections/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Inspection } from '@/lib/types'
import Link from 'next/link'

const typeConfig = {
  entree: { label: 'Entrée', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  sortie: { label: 'Sortie', className: 'text-orange-400 bg-orange-500/10' },
} as const

export default async function InspectionsPage() {
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*, property:property_id(title, neighborhood, city), lease:lease_id(tenant:tenant_id(full_name))')
    .order('inspection_date', { ascending: false })

  type InspectionRow = Inspection & {
    property: { title: string; neighborhood: string | null; city: string } | null
    lease: { tenant: { full_name: string } | null } | null
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Inspections</h2>
          <p className="text-sm text-[#888]">{inspections?.length ?? 0} états des lieux</p>
        </div>
        <Link
          href="/dashboard/inspections/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle inspection
        </Link>
      </div>

      <div className="bg-[#171717] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_80px_60px] gap-4 px-5 py-3 border-b border-white/[0.07] text-xs text-[#555] font-semibold uppercase tracking-wide">
          <span>Bien</span>
          <span>Locataire</span>
          <span>Date</span>
          <span>Type</span>
          <span>Rapport</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {(inspections as InspectionRow[] ?? []).map((insp) => {
            const tc = typeConfig[insp.type] ?? typeConfig.entree
            return (
              <Link
                key={insp.id}
                href={`/dashboard/inspections/${insp.id}`}
                className="grid sm:grid-cols-[1fr_1fr_100px_80px_60px] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{insp.property?.title ?? <span className="text-[#555]">—</span>}</p>
                  <p className="text-xs text-[#666] truncate">
                    {insp.property?.neighborhood ? `${insp.property.neighborhood}, ` : ''}{insp.property?.city}
                  </p>
                </div>
                <p className="text-sm text-[#888] truncate">
                  {insp.lease?.tenant?.full_name ?? <span className="text-[#555]">—</span>}
                </p>
                <p className="text-xs text-[#666]">{formatDate(insp.inspection_date)}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${tc.className}`}>{tc.label}</span>
                <span className="text-xs text-[#555]">{insp.report_url ? 'PDF' : '—'}</span>
              </Link>
            )
          })}
          {!inspections?.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#555]">Aucune inspection enregistrée</p>
              <Link href="/dashboard/inspections/new" className="text-xs text-[#3ECF8E] mt-1 inline-block hover:underline">
                Créer la première inspection
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier dans le navigateur**

`http://localhost:3000/dashboard/inspections` — liste vide avec lien vers /new.

- [ ] **Étape 3 : Commit**

```bash
git add app/dashboard/inspections/page.tsx
git commit -m "feat: page liste inspections"
```

---

## Task 13 : Formulaire nouvelle inspection (avec upload photos)

**Files:**
- Créer: `components/dashboard/inspection-form.tsx`
- Créer: `app/dashboard/inspections/new/actions.ts`
- Créer: `app/dashboard/inspections/new/page.tsx`

- [ ] **Étape 1 : Créer le Server Action `app/dashboard/inspections/new/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createInspection(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) redirect('/dashboard')

  const property_id = formData.get('property_id') as string | null
  const lease_id = formData.get('lease_id') as string | null
  const type = formData.get('type') as string
  const inspection_date = formData.get('inspection_date') as string
  const notes = formData.get('notes') as string | null
  const photosJson = formData.get('photos') as string | null
  const photos = photosJson ? JSON.parse(photosJson) as string[] : []

  const { data, error } = await supabase.from('inspections').insert({
    agency_id: profile.agency_id,
    property_id: property_id || null,
    lease_id: lease_id || null,
    type,
    inspection_date,
    notes: notes || null,
    photos,
  }).select('id').single()

  if (error || !data) {
    throw new Error('Erreur lors de la création de l\'inspection')
  }

  redirect(`/dashboard/inspections/${data.id}`)
}
```

- [ ] **Étape 2 : Créer `components/dashboard/inspection-form.tsx`**

```tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createInspection } from '@/app/dashboard/inspections/new/actions'

interface Property { id: string; title: string }
interface Lease { id: string; tenant_name: string; property_title: string }

export default function InspectionForm({
  properties,
  leases,
}: {
  properties: Property[]
  leases: Lease[]
}) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('inspections').upload(path, file)
        if (!error) {
          const { data } = supabase.storage.from('inspections').getPublicUrl(path)
          uploaded.push(data.publicUrl)
        }
      }
      setPhotos((prev) => [...prev, ...uploaded].slice(0, 10))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url))
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    formData.set('photos', JSON.stringify(photos))
    await createInspection(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Bien */}
        <div>
          <label className="block text-xs text-[#666] mb-1.5">Bien *</label>
          <select
            name="property_id"
            required
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
          >
            <option value="">Sélectionner un bien</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Bail / locataire */}
        <div>
          <label className="block text-xs text-[#666] mb-1.5">Locataire / bail</label>
          <select
            name="lease_id"
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
          >
            <option value="">Aucun (bien vacant)</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>{l.tenant_name} — {l.property_title}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-[#666] mb-1.5">Type *</label>
          <select
            name="type"
            required
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
          >
            <option value="entree">Entrée dans les lieux</option>
            <option value="sortie">Sortie des lieux</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs text-[#666] mb-1.5">Date *</label>
          <input
            name="inspection_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ECF8E]/50"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-[#666] mb-1.5">Notes / observations</label>
        <textarea
          name="notes"
          rows={4}
          placeholder="État général, observations, équipements présents..."
          className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#3ECF8E]/50 resize-none"
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-xs text-[#666] mb-2">Photos (max 10)</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map((url) => (
            <div key={url} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/[0.08]">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs"
              >
                Retirer
              </button>
            </div>
          ))}
          {photos.length < 10 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border border-dashed border-white/[0.15] hover:border-[#3ECF8E]/40 flex items-center justify-center text-[#555] hover:text-[#3ECF8E] transition text-2xl disabled:opacity-50"
            >
              {uploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : '+'}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-[#444]">{photos.length}/10 photos · JPEG, PNG, WebP</p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2.5 bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black text-sm font-semibold rounded-xl transition disabled:opacity-50"
      >
        {submitting ? 'Enregistrement...' : 'Créer l\'inspection'}
      </button>
    </form>
  )
}
```

- [ ] **Étape 3 : Créer `app/dashboard/inspections/new/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import InspectionForm from '@/components/dashboard/inspection-form'
import Link from 'next/link'

export default async function NewInspectionPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: leases }] = await Promise.all([
    supabase.from('properties').select('id, title').order('title'),
    supabase
      .from('leases')
      .select('id, tenant:tenant_id(full_name), property:property_id(title)')
      .eq('status', 'actif'),
  ])

  type LeaseRaw = {
    id: string
    tenant: { full_name: string } | null
    property: { title: string } | null
  }

  const leasesForForm = (leases as LeaseRaw[] ?? []).map((l) => ({
    id: l.id,
    tenant_name: l.tenant?.full_name ?? '—',
    property_title: l.property?.title ?? '—',
  }))

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inspections" className="text-[#555] hover:text-white transition text-sm">
          ← Inspections
        </Link>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Nouvelle inspection</h2>
        <p className="text-sm text-[#888] mt-0.5">État des lieux d&apos;entrée ou de sortie</p>
      </div>
      <InspectionForm
        properties={properties ?? []}
        leases={leasesForForm}
      />
    </div>
  )
}
```

- [ ] **Étape 4 : Vérifier dans le navigateur**

`http://localhost:3000/dashboard/inspections/new` — formulaire doit s'afficher. Tester la sélection d'un bien, la saisie de notes, l'upload de photos (si le bucket Supabase Storage `inspections` a été créé à Task 2). Soumettre le formulaire doit rediriger vers la page détail de l'inspection créée.

- [ ] **Étape 5 : Commit**

```bash
git add components/dashboard/inspection-form.tsx app/dashboard/inspections/new/
git commit -m "feat: formulaire nouvelle inspection avec upload photos Supabase Storage"
```

---

## Task 14 : Page détail inspection + rapport PDF

**Files:**
- Créer: `app/dashboard/inspections/[id]/page.tsx`
- Créer: `components/pdf/inspection-doc.tsx`
- Créer: `app/api/inspection-report/[id]/route.ts`

- [ ] **Étape 1 : Créer `components/pdf/inspection-doc.tsx`**

```tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottom: '2pt solid #3ECF8E', paddingBottom: 12 },
  agencyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111111' },
  badge: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#3ECF8E' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 16, color: '#111111' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#666666', textTransform: 'uppercase', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 9, color: '#888888' },
  value: { fontSize: 9, color: '#111111' },
  notes: { fontSize: 10, color: '#333333', lineHeight: 1.6, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: '48%', height: 150, objectFit: 'cover', borderRadius: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 7, color: '#aaaaaa', textAlign: 'center' },
})

interface InspectionDocProps {
  agencyName: string
  propertyTitle: string
  tenantName: string | null
  type: 'entree' | 'sortie'
  inspectionDate: string
  notes: string | null
  photos: string[]
}

export function InspectionDocument({
  agencyName, propertyTitle, tenantName, type, inspectionDate, notes, photos,
}: InspectionDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agencyName}>{agencyName}</Text>
          <Text style={styles.badge}>
            {type === 'entree' ? 'ÉTAT DES LIEUX D\'ENTRÉE' : 'ÉTAT DES LIEUX DE SORTIE'}
          </Text>
        </View>

        <Text style={styles.title}>Rapport d&apos;inspection</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Bien</Text>
            <Text style={styles.value}>{propertyTitle}</Text>
          </View>
          {tenantName && (
            <View style={styles.row}>
              <Text style={styles.label}>Locataire</Text>
              <Text style={styles.value}>{tenantName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{inspectionDate}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <Text style={styles.notes}>{notes}</Text>
          </View>
        )}

        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            <View style={styles.photoGrid}>
              {photos.slice(0, 6).map((url, i) => (
                <Image key={i} src={url} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Rapport généré par ImmoDesk — {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Étape 2 : Créer `app/api/inspection-report/[id]/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InspectionDocument } from '@/components/pdf/inspection-doc'
import { createElement } from 'react'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('*, property:property_id(title), lease:lease_id(tenant:tenant_id(full_name)), agency:agency_id(name)')
    .eq('id', id)
    .single()

  if (error || !inspection) {
    return new Response('Inspection introuvable', { status: 404 })
  }

  type InspectionData = typeof inspection & {
    property: { title: string } | null
    lease: { tenant: { full_name: string } | null } | null
    agency: { name: string } | null
  }

  const insp = inspection as InspectionData
  const dateFormatted = new Date(insp.inspection_date).toLocaleDateString('fr-FR')

  const buffer = await renderToBuffer(
    createElement(InspectionDocument, {
      agencyName: insp.agency?.name ?? 'Agence',
      propertyTitle: insp.property?.title ?? '—',
      tenantName: insp.lease?.tenant?.full_name ?? null,
      type: insp.type as 'entree' | 'sortie',
      inspectionDate: dateFormatted,
      notes: insp.notes,
      photos: insp.photos ?? [],
    })
  )

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="inspection-${dateFormatted.replace(/\//g, '-')}.pdf"`,
    },
  })
}
```

- [ ] **Étape 3 : Créer `app/dashboard/inspections/[id]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import type { Inspection } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const typeConfig = {
  entree: { label: 'Entrée dans les lieux', className: 'text-[#3ECF8E] bg-[#3ECF8E]/10' },
  sortie: { label: 'Sortie des lieux', className: 'text-orange-400 bg-orange-500/10' },
} as const

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select('*, property:property_id(title, neighborhood, city), lease:lease_id(tenant:tenant_id(full_name, whatsapp, phone))')
    .eq('id', id)
    .single()

  if (!inspection) notFound()

  type InspRow = Inspection & {
    property: { title: string; neighborhood: string | null; city: string } | null
    lease: { tenant: { full_name: string; whatsapp: string | null; phone: string | null } | null } | null
  }

  const insp = inspection as InspRow
  const tc = typeConfig[insp.type] ?? typeConfig.entree
  const tenantPhone = insp.lease?.tenant?.whatsapp ?? insp.lease?.tenant?.phone ?? ''
  const pdfUrl = `/api/inspection-report/${insp.id}`
  const waMsg = encodeURIComponent(
    `Bonjour ${insp.lease?.tenant?.full_name ?? ''}, votre rapport d'état des lieux est disponible ici : ${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}${pdfUrl}`
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inspections" className="text-[#555] hover:text-white transition text-sm">
          ← Inspections
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {insp.property?.title ?? 'Bien non précisé'}
          </h2>
          <p className="text-sm text-[#888] mt-0.5">
            {insp.property?.neighborhood ? `${insp.property.neighborhood}, ` : ''}{insp.property?.city}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#171717] border border-white/[0.08] hover:border-white/20 text-white text-xs font-semibold rounded-xl transition"
          >
            Voir PDF
          </a>
          {tenantPhone && (
            <a
              href={`https://wa.me/${tenantPhone.replace(/\D/g, '')}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-semibold rounded-xl transition"
            >
              Envoyer WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: 'Type', value: <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tc.className}`}>{tc.label}</span> },
          { label: 'Date', value: <span className="text-sm text-white">{formatDate(insp.inspection_date)}</span> },
          { label: 'Locataire', value: <span className="text-sm text-white">{insp.lease?.tenant?.full_name ?? '—'}</span> },
        ].map((item) => (
          <div key={item.label} className="bg-[#171717] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#555] mb-1">{item.label}</p>
            {item.value}
          </div>
        ))}
      </div>

      {/* Notes */}
      {insp.notes && (
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Observations</h3>
          <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap">{insp.notes}</p>
        </div>
      )}

      {/* Photos */}
      {(insp.photos ?? []).length > 0 && (
        <div className="bg-[#171717] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Photos ({insp.photos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {insp.photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-36 object-cover rounded-xl border border-white/[0.08] hover:border-white/20 transition"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Étape 4 : Ajouter `NEXT_PUBLIC_SITE_URL` dans `.env.local`**

```bash
# .env.local — ajouter la ligne suivante (ajuster selon l'environnement)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

En production, définir cette variable à l'URL de déploiement (ex. Vercel).

- [ ] **Étape 5 : Vérifier dans le navigateur**

1. Créer une inspection via `/dashboard/inspections/new`
2. La redirection vers `/dashboard/inspections/<id>` doit afficher les infos, les notes, les photos
3. Cliquer "Voir PDF" — un PDF doit s'ouvrir dans un nouvel onglet
4. Le bouton WhatsApp doit s'afficher si le locataire a un numéro

- [ ] **Étape 6 : Commit final**

```bash
git add components/pdf/inspection-doc.tsx app/api/inspection-report/ app/dashboard/inspections/[id]/ .env.local
git commit -m "feat: inspection détail + rapport PDF @react-pdf/renderer + partage WhatsApp"
```

---

## Vérification finale

- [ ] `npx tsc --noEmit` — 0 erreurs TypeScript
- [ ] `npm run build` — build de production sans erreur
- [ ] Tester le flux complet : créer un locataire + contrat + paiements → voir dans /occupation → détail locataire → quittance PDF → WhatsApp
- [ ] Tester le flux inspection : créer inspection → upload photo → voir PDF → WhatsApp
- [ ] Vérifier que la sidebar affiche bien la section "Location" avec les 3 liens
- [ ] Vérifier que le dashboard principal n'affiche plus "Bien non défini" ni "Client inconnu"
