-- Migration: create prospects and assets tables

-- Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  contact_name TEXT,
  contact_title TEXT,
  street TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  email TEXT,
  phone TEXT,
  fax TEXT,
  website TEXT,
  portfolio_url TEXT,
  portfolio_status TEXT,
  portfolio_total_buildings INTEGER,
  portfolio_assets JSONB,
  status TEXT DEFAULT 'new',
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects (status);
CREATE INDEX IF NOT EXISTS idx_prospects_name ON prospects (company_name);

-- Assets table (normalized portfolio assets)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_assets_prospect ON assets (prospect_id);

-- Optional: if you want PostGIS geography indexing for spatial queries, enable postgis and add a geography column
-- ALTER EXTENSION postgis;
-- ALTER TABLE assets ADD COLUMN IF NOT EXISTS geog geography(Point,4326);
-- UPDATE assets SET geog = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE lat IS NOT NULL AND lng IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_assets_geog ON assets USING GIST (geog);
