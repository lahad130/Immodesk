# ImmoDesk — État du projet

> Dernière mise à jour : 11 juin 2026

---

## ⚠️ Actions requises pour activer les dernières fonctionnalités

1. **Migration onboarding** : exécuter `supabase/migrations/20260611000000_onboarding_agency.sql`
   dans le SQL Editor de Supabase. Sans elle, les nouveaux inscrits ne peuvent pas créer leur agence.
2. **Variables d'environnement Vercel** (optionnelles mais recommandées) :
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` : numéro WhatsApp business au format international sans `+`
     (ex : `221770000000`). Active les boutons « Demander une démo », « Contacter l'équipe »
     et le bouton WhatsApp flottant sur la landing.
   - `NEXT_PUBLIC_SITE_URL` : URL de production (ex : `https://immodesk.vercel.app`).
     Utilisée pour le SEO (Open Graph, sitemap, robots).

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

### Pages publiques (landing, auth, onboarding) — style « Anthropic »
- **Background** : `#FAF9F5` (crème) · sections alternées `#F0EEE6`
- **Cards** : blanc, bordure `#E6E4DA`, coins très arrondis (`rounded-2xl/3xl`)
- **Texte** : `#181818` (principal) · `#62605B` (secondaire) · `#91908C` (muted)
- **Accent** : `#CC785C` (terracotta)
- **CTA** : boutons noirs `#181818` arrondis (`rounded-full`)
- **Titres** : serif (Source Serif 4, `font-serif`) · Corps : Geist Sans

### Dashboard (produit) — thème sombre conservé
- **Background** : `#0f0f0f` · **Surface / Cards** : `#171717`
- **Brand** : `#3ECF8E` · **Texte secondaire** : `#888`
- **Bordures** : `rgba(255,255,255,0.08)`

- **Langue** : Français · Prix en FCFA

---

## Fait le 11 juin 2026 (préparation lancement / premiers clients)

- [x] **Multi-agences / onboarding agence** : un nouvel inscrit est redirigé vers `/onboarding`
      où il crée son agence (RPC `create_agency_for_current_user`, SECURITY DEFINER, idempotente,
      le créateur devient `admin`). Le layout dashboard redirige vers `/onboarding` si le profil
      n'a pas d'`agency_id` ; le middleware protège `/onboarding`.
- [x] **Landing page repositionnée gestion locative** : hero, features, mockup réécrits autour
      des vraies fonctionnalités (suivi loyers, relances WhatsApp, bail loi 77-60, quittances PDF,
      états des lieux, documents). Fausse preuve sociale « +200 agences » supprimée.
- [x] **Section FAQ** (objections prospects : gratuité, conformité loi 77-60, Wave/Orange Money,
      sécurité, mobile, formation).
- [x] **CTA WhatsApp** : bouton flottant + « Demander une démo » + plan Entreprise,
      activés via `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [x] **SEO** : métadonnées complètes (title template, keywords, Open Graph, Twitter),
      `robots.txt` et `sitemap.xml` générés, dashboard exclu de l'indexation.
- [x] Lint : 0 erreur (fix `Date.now()` page occupation, `Math.random()` agent IA).

## Ce qui reste à faire (prochaines sessions)

- [ ] Formulaire d'ajout/édition de lead
- [ ] Formulaire d'ajout/édition de bien
- [ ] Filtres et recherche sur la liste des leads
- [ ] Planification de visite (formulaire)
- [ ] Intégration vraie IA (Claude API) dans Agent IA
- [ ] Page profil utilisateur / page paramètres agence (modifier nom, téléphone, ville)
- [ ] Invitation de collaborateurs dans une agence (multi-utilisateurs)
- [ ] Notifications par email/SMS
- [ ] Vider les données seed de démo ou les réserver à un compte démo dédié
