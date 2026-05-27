export type LeadStatus = 'chaud' | 'tiede' | 'nouveau' | 'froid'
export type LeadSource = 'site_web' | 'referral' | 'reseaux_sociaux' | 'appel_direct' | 'agence'
export type PropertyType = 'appartement' | 'villa' | 'bureau' | 'terrain' | 'duplex'
export type TransactionType = 'achat' | 'location' | 'vente'
export type PropertyStatus = 'disponible' | 'reserve' | 'vendu' | 'loue'
export type VisitStatus = 'planifiee' | 'effectuee' | 'annulee'
export type UserRole = 'admin' | 'manager' | 'agent'

export interface Agency {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string
  country: string
  created_at: string
}

export interface Profile {
  id: string
  agency_id: string | null
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export interface Lead {
  id: string
  agency_id: string
  assigned_to: string | null
  full_name: string
  phone: string | null
  email: string | null
  status: LeadStatus
  source: LeadSource | null
  budget_min: number | null
  budget_max: number | null
  property_type: PropertyType | null
  transaction_type: TransactionType
  notes: string | null
  last_contact_at: string | null
  created_at: string
  // joined
  assignee?: Profile | null
}

export interface Property {
  id: string
  agency_id: string
  agent_id: string | null
  title: string
  description: string | null
  transaction_type: 'vente' | 'location'
  property_type: PropertyType | null
  price: number
  area_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  neighborhood: string | null
  city: string
  status: PropertyStatus
  images: string[] | null
  created_at: string
}

export interface Visit {
  id: string
  agency_id: string
  lead_id: string | null
  property_id: string | null
  agent_id: string | null
  scheduled_at: string
  status: VisitStatus
  notes: string | null
  created_at: string
  // joined
  lead?: Lead | null
  property?: Property | null
  agent?: Profile | null
}

export interface DashboardMetrics {
  leadsThisMonth: number
  leadsGrowth: number
  visitsScheduled: number
  conversionRate: number
  aiMessages: number
  activeProperties: number
}

export type LeaseStatus = 'actif' | 'expire' | 'resilie'
export type PaymentStatus = 'paye' | 'en_attente' | 'retard'
export type PaymentMethod = 'especes' | 'orange_money' | 'wave' | 'virement' | 'cheque'
export type InspectionType = 'entree' | 'sortie'
export type IncidentStatus = 'ouvert' | 'en_cours' | 'resolu'
export type DocumentCategory = 'contrat' | 'titre' | 'mandat' | 'bail' | 'quittance' | 'etat_des_lieux' | 'autres'

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
  payment_method: PaymentMethod | null
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
