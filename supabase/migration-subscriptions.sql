-- ============================================
-- TrailNotes - Subscriptions Migration
-- ============================================
-- Spusť tento SQL v Supabase SQL Editoru
-- Sledování nákladů na SaaS a software
-- ============================================

-- ============================================
-- 1. SUBSCRIPTIONS - Sledování předplatných
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

-- Index pro rychlé filtrování
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================
-- 2. VIEW - Přehled s měsíčními náklady v CZK
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
-- 3. RLS - Row Level Security
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT - pouze vlastní záznamy
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT - pouze pro sebe
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE - pouze vlastní záznamy
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE - pouze vlastní záznamy
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. REALTIME - Povolit realtime updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- ============================================
-- HOTOVO! Migrace pro subscriptions dokončena.
-- ============================================
