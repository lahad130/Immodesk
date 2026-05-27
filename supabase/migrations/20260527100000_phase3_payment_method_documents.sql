-- Phase 3: payment_method on payments + documents table

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method text
  CHECK (
    payment_method IS NULL OR
    payment_method = ANY(ARRAY['especes','orange_money','wave','virement','cheque'])
  );

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
