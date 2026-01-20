-- ============================================
-- TrailNotes v2 Migration
-- ============================================
-- Spusť tento SQL v Supabase SQL Editoru
-- Pro EXISTUJÍCÍ databázi (upgrade)
-- ============================================

-- 1. Přidání links a tags sloupců do existujících tabulek
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS links TEXT[] DEFAULT '{}';
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS links TEXT[] DEFAULT '{}';
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================
-- 2. LINK_CATEGORIES - Kategorie odkazů
-- ============================================
CREATE TABLE IF NOT EXISTS link_categories (
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
DROP POLICY IF EXISTS "User own link_categories" ON link_categories;
CREATE POLICY "User own link_categories" ON link_categories
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 3. LINKS - Uložené odkazy
-- ============================================
CREATE TABLE IF NOT EXISTS links (
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
DROP POLICY IF EXISTS "User own links" ON links;
CREATE POLICY "User own links" ON links
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. Realtime pro nové tabulky
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE link_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE links;

-- ============================================
-- HOTOVO! Migrace dokončena.
-- ============================================
