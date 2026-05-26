# ImmoDesk — État du projet

> Dernière mise à jour : 26 mai 2026

---

## Stack

- **Framework** : Next.js 16 (App Router, Turbopack)
- **Auth & BDD** : Supabase (SSR)
- **Style** : Tailwind CSS v4, Geist font
- **Déploiement** : Vercel + GitHub `lahad130/Immodesk`

---

## Variables d'environnement

Fichier `.env.local` (non commité, à recréer si besoin) :

```
NEXT_PUBLIC_SUPABASE_URL=https://ejcotcvbgxtolrmftnji.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_g3_tLbOlTG_BOCN_SQhdJA_OFxTirGA
```

Ces mêmes variables sont configurées sur Vercel (Production + Preview + Development).

---

## Supabase

**Projet** : `ejcotcvbgxtolrmftnji.supabase.co`

### Tables

| Table | Description |
|-------|-------------|
| `agencies` | Agences (1 seed : Teranga Immo) |
| `profiles` | Profils utilisateurs, auto-créé au signup via trigger |
| `leads` | 20 leads sénégalais seedés |
| `properties` | 15 biens immobiliers Dakar seedés |
| `visits` | 15 visites planifiées/passées seedées |

### Auth — URL Configuration

- **Site URL** : URL Vercel de production
- **Redirect URLs** :
  - `http://localhost:3000/auth/callback`
  - `https://<votre-url>.vercel.app/auth/callback`

---

## Structure des fichiers clés

```
app/
  page.tsx                    # Landing page
  dashboard/
    layout.tsx                # Layout protégé (vérifie auth)
    page.tsx                  # Accueil dashboard (métriques live)
    leads/page.tsx            # Table des leads
    properties/page.tsx       # Grille des biens
    visits/page.tsx           # Timeline des visites
    ai-agent/page.tsx         # Chat IA (mock)
    documents/page.tsx        # Gestion documents (mock)
  login/page.tsx
  signup/page.tsx
  forgot-password/page.tsx
  reset-password/page.tsx
  logout/page.tsx             # Server component → signOut()
  auth/callback/route.ts      # Échange code Supabase

components/
  landing/                    # Header, Hero, Features, Pricing, Footer
  dashboard/
    sidebar.tsx               # Navigation collapsible
    topbar.tsx                # Barre haute avec notif + avatar
    lead-status-badge.tsx     # Badge chaud/tiède/nouveau/froid

lib/
  supabase/
    client.ts                 # Browser client
    server.ts                 # Server client
    proxy.ts                  # updateSession() middleware
  types.ts                    # Types TypeScript (Lead, Property, Visit…)

proxy.ts                      # Middleware Next.js 16 (protection /dashboard)
```

---

## Flows auth (tous fonctionnels)

| Flow | Destination finale |
|------|--------------------|
| Login réussi | `/dashboard` |
| Signup (confirmation off) | `/dashboard` |
| Signup (confirmation on) | email → lien → `/dashboard` |
| Mot de passe oublié | email → `/reset-password` → `/dashboard` |
| Logout | `/` (landing) |

---

## Design

- **Background** : `#0f0f0f`
- **Surface / Cards** : `#171717`
- **Brand** : `#3ECF8E`
- **Texte secondaire** : `#888`
- **Bordures** : `rgba(255,255,255,0.08)`
- **Typographie** : Geist Sans + Geist Mono
- **Langue** : Français · Prix en FCFA

---

## Ce qui reste à faire (prochaines sessions)

- [ ] Formulaire d'ajout/édition de lead
- [ ] Formulaire d'ajout/édition de bien
- [ ] Filtres et recherche sur la liste des leads
- [ ] Planification de visite (formulaire)
- [ ] Intégration vraie IA (Claude API) dans Agent IA
- [ ] Upload de documents (Supabase Storage)
- [ ] Multi-agences / onboarding agence
- [ ] Page profil utilisateur
- [ ] Notifications par email/SMS
