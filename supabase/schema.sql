-- ============================================
-- TrailNotes - Kompletní databázové schéma
-- ============================================
-- PRO NOVOU INSTALACI: Spusť celý tento soubor
-- PRO UPGRADE: Použij migration-v2.sql
--
-- Kde: Supabase Dashboard → SQL Editor → New Query
-- ============================================
--
-- Tabulky:
--   1. ideas          - Programovací nápady
--   2. deployments    - Služby (Lambda, n8n, RPi...)
--   3. link_categories - Kategorie odkazů
--   4. links          - Uložené odkazy
--   5. app_settings   - Nastavení aplikace
--   6. allowed_users  - Whitelist uživatelů
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. IDEAS - Programovací nápady
-- ============================================
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pro ideas
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own ideas" ON ideas
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. DEPLOYMENTS - Správa služeb
-- ============================================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  project TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('AWS Lambda','n8n','Raspberry Pi','Docker','Vercel','EC2')),
  url_ip TEXT,
  status TEXT CHECK (status IN ('running','stopped','error')) DEFAULT 'running',
  last_ping TIMESTAMPTZ,
  description TEXT,
  links TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pro deployments
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own deployments" ON deployments
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 3. LINK_CATEGORIES - Kategorie odkazů
-- ============================================
CREATE TABLE link_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- RLS pro link_categories
ALTER TABLE link_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own link_categories" ON link_categories
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. LINKS - Uložené odkazy
-- ============================================
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES link_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pro links
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own links" ON links
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. APP_SETTINGS - Globální nastavení aplikace
-- ============================================
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Výchozí nastavení - přístup pro všechny
INSERT INTO app_settings (key, value) VALUES
  ('access_mode', 'all');  -- 'all' = všichni, 'whitelist' = jen povolení

-- RLS - čtení pro všechny přihlášené, zápis nikdo (pouze přes service role)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 6. ALLOWED_USERS - Whitelist povolených uživatelů
-- ============================================
CREATE TABLE allowed_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  added_by TEXT,  -- email admina který přidal
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS - čtení pro všechny přihlášené
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read allowed_users" ON allowed_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 7. REALTIME - Povolit realtime pro tabulky
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE link_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE links;

-- ============================================
-- HOTOVO! Nyní nastav v aplikaci:
-- 1. ADMIN_EMAIL v .env.local
-- 2. Google OAuth v Supabase dashboard
-- ============================================
