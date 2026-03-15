-- Pokrenuti u Supabase SQL Editor na postojećem projektu (work-order-app)
-- Kreiranje tablice za klijentske prijave servisa

CREATE TABLE IF NOT EXISTS klijentske_prijave (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Uređaj — snapshot u trenutku prijave (lookup po S/N)
  sn_poslan           text,
  tip_sistema         text,
  serijski_broj       text,
  poduzece            text,
  -- Operater
  ime_operatera       text NOT NULL,
  prezime_operatera   text NOT NULL,
  email               text NOT NULL,
  telefon             text NOT NULL,
  -- Sadržaj prijave
  opis_problema       text NOT NULL DEFAULT '',
  slika_storage_path  text,
  zeljeno_vrijeme     timestamptz,
  -- Workflow status
  status              text NOT NULL DEFAULT 'na_cekanju'
                        CHECK (status IN ('nova', 'u_obradi', 'zatvorena', 'na_cekanju')),
  -- E-mail verifikacija
  verification_token  text UNIQUE,
  verified_at         timestamptz,
  -- Audit / rate limiting
  ip_address          text,
  -- Timestamps
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Index za rate limiting upit
CREATE INDEX IF NOT EXISTS idx_klijentske_prijave_ip
  ON klijentske_prijave (ip_address, created_at);

-- Index za status filter (admin pregled u budućnosti)
CREATE INDEX IF NOT EXISTS idx_klijentske_prijave_status
  ON klijentske_prijave (status, created_at DESC);

-- Index za brzo traženje po verifikacijskom tokenu
CREATE INDEX IF NOT EXISTS idx_klijentske_prijave_token
  ON klijentske_prijave (verification_token)
  WHERE verification_token IS NOT NULL;

-- Auto-update updated_at (reuse existing trigger function ako postoji)
CREATE TRIGGER klijentske_prijave_updated_at
  BEFORE UPDATE ON klijentske_prijave
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: uključiti
ALTER TABLE klijentske_prijave ENABLE ROW LEVEL SECURITY;

-- Serviseri mogu čitati sve prijave (za buduću admin integraciju)
CREATE POLICY "serviseri_citaju_prijave" ON klijentske_prijave
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM serviseri WHERE id = auth.uid()));

-- INSERT: samo via service role (API route) — ne treba RLS policy za anon
-- Service role automatski bypassa RLS

-- ─── MIGRACIJA (pokrenuti na postojećoj bazi) ────────────────────────────────
--
-- ALTER TABLE klijentske_prijave
--   ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS telefon text NOT NULL DEFAULT '',
--   ADD COLUMN IF NOT EXISTS verification_token text UNIQUE,
--   ADD COLUMN IF NOT EXISTS verified_at timestamptz;
--
-- ALTER TABLE klijentske_prijave
--   DROP CONSTRAINT klijentske_prijave_status_check;
-- ALTER TABLE klijentske_prijave
--   ADD CONSTRAINT klijentske_prijave_status_check
--   CHECK (status IN ('nova', 'u_obradi', 'zatvorena', 'na_cekanju'));
--
-- ALTER TABLE klijentske_prijave
--   ALTER COLUMN email DROP DEFAULT,
--   ALTER COLUMN telefon DROP DEFAULT;
--
-- CREATE INDEX IF NOT EXISTS idx_klijentske_prijave_token
--   ON klijentske_prijave (verification_token)
--   WHERE verification_token IS NOT NULL;
