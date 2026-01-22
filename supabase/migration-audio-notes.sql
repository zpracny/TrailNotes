-- ============================================
-- TrailNotes - Audio Notes Migration
-- ============================================
-- Spusť tento SQL v Supabase SQL Editoru
-- Hlasové poznámky s Whisper transkripcí
-- ============================================

-- ============================================
-- 1. AUDIO_NOTES - Hlasové poznámky
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

-- Indexy pro rychlé dotazy
CREATE INDEX idx_audio_notes_user_id ON audio_notes(user_id);
CREATE INDEX idx_audio_notes_status ON audio_notes(status);
CREATE INDEX idx_audio_notes_created_at ON audio_notes(created_at DESC);

-- ============================================
-- 2. RLS - Row Level Security
-- ============================================
ALTER TABLE audio_notes ENABLE ROW LEVEL SECURITY;

-- SELECT - pouze vlastní záznamy
CREATE POLICY "Users can view own audio notes"
  ON audio_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT - pouze pro sebe
CREATE POLICY "Users can insert own audio notes"
  ON audio_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE - pouze vlastní záznamy
CREATE POLICY "Users can update own audio notes"
  ON audio_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE - pouze vlastní záznamy
CREATE POLICY "Users can delete own audio notes"
  ON audio_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. SERVICE ROLE POLICY - Pro Python Worker
-- ============================================
-- Worker používá service_role key, který obchází RLS
-- Pokud chceš explicitní politiku pro worker (volitelné):

-- Alternativně: Povolit update pro service role na status a transcription
-- (Service role má přístup automaticky, toto je jen pro dokumentaci)

-- ============================================
-- 4. REALTIME - Povolit realtime updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE audio_notes;

-- ============================================
-- 5. STORAGE BUCKET - audio-uploads
-- ============================================
-- POZOR: Storage bucket se vytváří přes Supabase Dashboard nebo API
--
-- Postup v Dashboard:
-- 1. Jdi do Storage → New bucket
-- 2. Název: audio-uploads
-- 3. Public bucket: ANO (pro snadný přístup z workeru)
-- 4. Allowed MIME types: audio/*
-- 5. Max file size: 50MB (nebo dle potřeby)
--
-- Alternativně přes SQL (Supabase storage schema):

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  true,
  52428800, -- 50MB
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. STORAGE RLS - Policies pro bucket
-- ============================================

-- Authenticated users can upload their own files
CREATE POLICY "Users can upload audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own files
CREATE POLICY "Users can read own audio files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
CREATE POLICY "Users can delete own audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access (pro worker) - volitelné pokud je bucket public
CREATE POLICY "Public read access for audio files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'audio-uploads');

-- ============================================
-- HOTOVO!
--
-- Struktura souborů v bucketu:
--   audio-uploads/{user_id}/{filename}.webm
--
-- Worker (Python) používá service_role key pro:
--   - Čtení pending záznamů
--   - Stažení audio souboru
--   - Update status a transcription
-- ============================================
