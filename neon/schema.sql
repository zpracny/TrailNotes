-- ============================================
-- TrailNotes - Neon Database Schema
-- ============================================
-- Migrace ze Supabase na Neon
--
-- POZOR: RLS policies jsou odstraněny - autorizace
-- se řeší v aplikační vrstvě (Server Actions)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. IDEAS - Programovací nápady
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,  -- Reference na Neon Auth user
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);

-- ============================================
-- 2. DEPLOYMENTS - Správa služeb
-- ============================================
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);

-- ============================================
-- 3. LINK_CATEGORIES - Kategorie odkazů
-- ============================================
CREATE TABLE IF NOT EXISTS link_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_link_categories_user_id ON link_categories(user_id);

-- ============================================
-- 4. LINKS - Uložené odkazy
-- ============================================
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES link_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_category_id ON links(category_id);

-- ============================================
-- 5. APP_SETTINGS - Globální nastavení aplikace
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Výchozí nastavení
INSERT INTO app_settings (key, value) VALUES
  ('access_mode', 'all')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 6. ALLOWED_USERS - Whitelist povolených uživatelů
-- ============================================
CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. SUBSCRIPTIONS - Sledování SaaS nákladů
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CZK' CHECK (currency IN ('CZK', 'EUR', 'USD')),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'yearly')),
  category TEXT,
  next_billing_date DATE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('automatic', 'manual')),
  priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3)) DEFAULT 2,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================
-- 8. VIEW - Subscriptions Overview
-- ============================================
CREATE OR REPLACE VIEW subscriptions_overview AS
SELECT
  s.*,
  ROUND(
    (s.amount *
      CASE s.currency
        WHEN 'USD' THEN 24
        WHEN 'EUR' THEN 25
        ELSE 1
      END
    ) /
    CASE s.frequency
      WHEN 'yearly' THEN 12
      ELSE 1
    END
  )::INTEGER AS monthly_cost_czk
FROM subscriptions s;

-- ============================================
-- 9. AUDIO_NOTES - Hlasové poznámky
-- ============================================
CREATE TABLE IF NOT EXISTS audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  audio_path TEXT NOT NULL,  -- Bude URL z Vercel Blob místo Supabase Storage
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audio_notes_user_id ON audio_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_notes_status ON audio_notes(status);
CREATE INDEX IF NOT EXISTS idx_audio_notes_created_at ON audio_notes(created_at DESC);

-- ============================================
-- HOTOVO!
--
-- Co bylo odstraněno (Supabase-specifické):
-- - auth.users foreign key references
-- - RLS policies (auth.uid(), auth.role())
-- - storage.buckets a storage.objects
-- - supabase_realtime publication
--
-- Autorizace se nyní řeší v aplikaci:
-- - Každý query musí obsahovat WHERE user_id = ?
-- - Storage přes Vercel Blob
-- - Realtime přes polling nebo SSE
-- ============================================
