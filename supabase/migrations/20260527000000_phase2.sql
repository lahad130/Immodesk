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
