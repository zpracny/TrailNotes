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
-- 7. SUBSCRIPTIONS - Sledování SaaS nákladů
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
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

-- Indexy pro subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- RLS pro subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

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
CREATE TABLE audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  audio_path TEXT NOT NULL,
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT
);

-- Indexy pro audio_notes
CREATE INDEX idx_audio_notes_user_id ON audio_notes(user_id);
CREATE INDEX idx_audio_notes_status ON audio_notes(status);
CREATE INDEX idx_audio_notes_created_at ON audio_notes(created_at DESC);

-- RLS pro audio_notes
ALTER TABLE audio_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audio notes" ON audio_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio notes" ON audio_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio notes" ON audio_notes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio notes" ON audio_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 10. STORAGE BUCKET - audio-uploads
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  true,
  52428800,
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload audio files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own audio files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own audio files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read access for audio files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'audio-uploads');

-- ============================================
-- 11. REALTIME - Povolit realtime pro tabulky
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE link_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE links;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE audio_notes;

-- ============================================
-- HOTOVO! Nyní nastav v aplikaci:
-- 1. ADMIN_EMAIL v .env.local
-- 2. Google OAuth v Supabase dashboard
-- ============================================
