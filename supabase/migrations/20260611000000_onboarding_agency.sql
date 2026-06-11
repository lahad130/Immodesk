-- Onboarding multi-agence : un nouvel utilisateur crée sa propre agence.
-- SECURITY DEFINER pour passer outre les RLS sur agencies/profiles,
-- la fonction vérifie elle-même auth.uid().

CREATE OR REPLACE FUNCTION create_agency_for_current_user(
  p_name text,
  p_phone text DEFAULT NULL,
  p_city text DEFAULT 'Dakar'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing uuid;
  v_agency uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF coalesce(trim(p_name), '') = '' THEN
    RAISE EXCEPTION 'Le nom de l''agence est requis';
  END IF;

  -- Idempotent : si le profil a déjà une agence, on la renvoie.
  SELECT agency_id INTO v_existing FROM profiles WHERE id = v_user;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO agencies (name, phone, city, country)
  VALUES (
    trim(p_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    coalesce(nullif(trim(coalesce(p_city, '')), ''), 'Dakar'),
    'Sénégal'
  )
  RETURNING id INTO v_agency;

  -- Le créateur de l'agence en devient l'admin.
  UPDATE profiles SET agency_id = v_agency, role = 'admin' WHERE id = v_user;
  IF NOT FOUND THEN
    INSERT INTO profiles (id, agency_id, role) VALUES (v_user, v_agency, 'admin');
  END IF;

  RETURN v_agency;
END;
$$;

REVOKE ALL ON FUNCTION create_agency_for_current_user(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION create_agency_for_current_user(text, text, text) TO authenticated;
