# ImmoDesk Phase 2 — Design Spec

**Date:** 2026-05-27  
**Contexte:** Agences immobilières Afrique de l'Ouest, prix FCFA, marché sénégalais  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Tailwind CSS v4, Recharts

---

## Décisions clés

- **Portail locataire :** pas d'accès externe — tout est géré côté agent. L'agent consulte les contrats, paiements, incidents et peut envoyer des rapports PDF par WhatsApp.
- **Graphiques :** Recharts (léger, natif React, pas de config lourde).
- **Migration :** une seule migration Supabase pour les 5 nouvelles tables.
- **Pas d'emojis** dans l'UI — outil B2B professionnel, icônes SVG uniquement.

---

## 1. Schéma de base de données

Une seule migration appliquée avant toute UI. RLS activé sur chaque table avec filtrage par `agency_id`.

### `tenants`
```sql
id uuid PK, agency_id uuid FK agencies, full_name text,
phone text, whatsapp text, email text, created_at timestamptz
```

### `leases`
```sql
id uuid PK, agency_id uuid FK agencies,
property_id uuid FK properties, tenant_id uuid FK tenants,
start_date date, end_date date,
monthly_rent bigint (FCFA), deposit bigint (FCFA),
status text CHECK ('actif','expiré','résilié'),
created_at timestamptz
```

### `payments`
```sql
id uuid PK, lease_id uuid FK leases,
amount_fcfa bigint, due_date date, paid_date date NULLABLE,
status text CHECK ('payé','en_attente','retard'),
created_at timestamptz
```

### `inspections`
```sql
id uuid PK, agency_id uuid FK agencies,
property_id uuid FK properties, lease_id uuid FK leases NULLABLE,
type text CHECK ('entrée','sortie'),
inspection_date date, notes text,
photos text[] (URLs Supabase Storage),
report_url text NULLABLE,
created_at timestamptz
```

### `incidents`
```sql
id uuid PK, agency_id uuid FK agencies,
property_id uuid FK properties, lease_id uuid FK leases NULLABLE,
title text, description text,
status text CHECK ('ouvert','en_cours','résolu'),
created_at timestamptz
```

---

## 2. Fix bug — "Bien non défini / Client inconnu"

**Cause :** Certaines visites en base ont `lead_id` ou `property_id` à `null`. L'UI affiche des fallbacks laids.

**Fix :**
1. Corriger les données seed via une requête SQL directe sur Supabase : mettre à jour les lignes de `visits` qui ont `lead_id IS NULL` ou `property_id IS NULL` pour les associer à des leads et biens existants en base.
2. Améliorer le texte de fallback dans `app/dashboard/page.tsx` et `app/dashboard/visits/page.tsx` : remplacer "Bien non défini" par "Non assigné" et "Client inconnu" par "—", avec un style atténué (couleur `#555`).
3. Pas de refactor de la requête Supabase — la logique de jointure est correcte, le problème est côté données.

---

## 3. Module Taux d'occupation

**Route :** `/dashboard/occupation`  
**Type :** Server Component (SSR, données fraîches à chaque chargement)

### KPIs (4 métriques en tête)
- % taux d'occupation = biens loués / total biens en location
- Nombre de biens loués / total
- Revenus locatifs encaissés ce mois (FCFA)
- Revenus locatifs attendus ce mois (FCFA)

Données : `leases` (status=actif) + `payments` (mois courant).

### Graphique 6 mois
- `BarChart` Recharts, responsive
- X : mois (format `MMM` en français)
- Y : taux d'occupation en %
- Couleur barre : `#3ECF8E`, tooltip FCFA pour les revenus
- Données calculées côté serveur par agrégation sur `leases` et `payments`

### Table locataires en retard
Colonnes : locataire · bien · loyer mensuel · montant en retard · jours de retard · action WhatsApp  
Filtre : `payments.status = 'retard'`  
Bouton WhatsApp : lien `https://wa.me/<whatsapp>?text=...` pré-rempli en français

### Vue statut des biens en location
Liste simple : titre du bien · locataire actuel · fin de contrat · statut (actif / expirant < 30j / expiré)

---

## 4. Gestion locataires

**Routes :**
- `/dashboard/locataires` — liste paginée
- `/dashboard/locataires/[id]` — détail locataire

### Liste (`/dashboard/locataires`)
Colonnes : nom · téléphone · bien loué · loyer mensuel · statut paiement  
Filtres : statut (tous / en retard / actif)  
Bouton "Nouveau locataire" → modal de création (nom, téléphone, WhatsApp, email)

### Détail (`/dashboard/locataires/[id]`)
Sections :
1. **Info locataire** — coordonnées + bouton WhatsApp direct
2. **Contrat actif** — bien, dates, loyer, caution
3. **Historique paiements** — table chronologique avec statuts colorés (payé/en attente/retard)
4. **Incidents** — liste avec statut, bouton "Résolu"
5. **Actions** — "Générer quittance PDF" · "Envoyer par WhatsApp"

### PDF quittance
Généré via `@react-pdf/renderer` dans une Route Handler (`/api/quittance/[paymentId]`), qui retourne un `application/pdf` streamé.  
Contenu : en-tête agence · coordonnées locataire · bien · période · montant FCFA · mention "PAYÉ le JJ/MM/AAAA" ou "EN ATTENTE".  
WhatsApp : bouton sur la page détail qui ouvre `wa.me/<whatsapp>?text=Quittance+disponible+:+<URL_complète_de_la_route_handler>`. L'agent partage l'URL — le destinataire l'ouvre dans son navigateur.

---

## 5. Inspections des biens

**Routes :**
- `/dashboard/inspections` — liste des états des lieux
- `/dashboard/inspections/new` — formulaire nouvelle inspection
- `/dashboard/inspections/[id]` — détail + rapport PDF

### Formulaire
Champs : bien (select) · locataire/bail (select) · type (entrée/sortie) · date · notes libres  
Upload photos : Supabase Storage bucket `inspections`, jusqu'à 10 photos, upload direct depuis le browser (Client Component)  
Validation : bien obligatoire, type obligatoire, date obligatoire

### Rapport PDF
Généré via `@react-pdf/renderer` dans une Route Handler (`/api/inspection-report/[id]`).  
Contenu : en-tête agence · bien · locataire · date · type · notes · grille photos (avant/après en 2 colonnes) · signature.  
Stocké dans `inspections.report_url` (Supabase Storage).

### WhatsApp
Lien `wa.me/<phone>?text=Rapport+état+des+lieux+disponible+ici+:+<url>` sur la page détail.

---

## 6. Sidebar

Ajout d'une section "Location" entre "Visites" et "Agent IA" :
- Occupation (icône SVG graphique barres)
- Locataires (icône SVG personne)
- Inspections (icône SVG clipboard)

Pas de refactor de la sidebar existante — ajout minimal des 3 entrées + séparateur + label de section.

---

## Ordre de livraison

1. Migration Supabase unique (5 tables + RLS)
2. Fix bug visites + amélioration seed data
3. Module Taux d'occupation
4. Gestion locataires (liste + détail + quittance PDF)
5. Inspections (formulaire + upload photos + rapport PDF)
6. Sidebar mise à jour

---

## Contraintes

- Tous les montants affichés en FCFA avec `formatFCFA()` (helper existant)
- Langue UI : français
- Aucun emoji dans l'UI — icônes SVG uniquement
- Thème : fond `#0f0f0f`, vert `#3ECF8E`, cards `#171717`, bordures `rgba(255,255,255,0.08)`
- WhatsApp via liens `wa.me` uniquement (pas d'API payante)
- PDF via `@react-pdf/renderer` (Route Handler, pas de lib externe payante)
