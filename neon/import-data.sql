-- ============================================
-- TrailNotes - Import dat ze Supabase
-- ============================================
-- POZOR: user_id je ze Supabase Auth
-- Po prvním přihlášení do Neon Auth bude potřeba
-- aktualizovat user_id na nové Neon Auth ID
-- ============================================

-- Staré Supabase user_id (pro referenci)
-- ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56

-- ============================================
-- APP_SETTINGS
-- ============================================
INSERT INTO app_settings (id, key, value, updated_at) VALUES
('c8781297-c313-40e6-8cfb-d33a653693f4', 'access_mode', 'all', '2026-01-19 18:26:53.704378+00')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- IDEAS
-- ============================================
INSERT INTO ideas (id, user_id, title, description, tags, status, created_at, updated_at, links) VALUES
('002329e5-8dd8-45b1-a278-1d6aed4bdcb3', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', 'Vyzkoušet Brouter', 'Tady je https://gemini.google.com/app/2ec14e15da49a0d7 odkaz na gemini kde to řeším a zbytek claude code. ', '{}', 'in-progress', '2026-01-19 19:36:25.468336+00', '2026-01-20 16:33:53.951+00', '{}'),
('46afed01-474a-4e92-9cae-39cdb2cae294', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', 'Brouter a plánovač s počasím', 'https://www.perplexity.ai/search/muzes-mi-udelat-detailni-a-hlo-pXEj7VckQ3WY9ub27LGtEg#0', '{"TrailMetrics"}', 'todo', '2026-01-23 07:03:17.915397+00', '2026-01-23 08:02:03.532+00', '{"https://www.perplexity.ai/search/muzes-mi-udelat-detailni-a-hlo-pXEj7VckQ3WY9ub27LGtEg#0"}'),
('4c11108f-8943-4e35-9ec0-165e2de45019', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', 'Realtime Deployment Board', 'https://www.perplexity.ai/search/co-mi-to-ted-pise-3UuzURWkQiqcfNjmqEMLCQ#8', '{}', 'todo', '2026-01-23 07:05:10.272733+00', '2026-01-23 08:01:44.905+00', '{"https://www.perplexity.ai/search/co-mi-to-ted-pise-3UuzURWkQiqcfNjmqEMLCQ#8"}'),
('c804fcf5-5945-41ae-83f4-b48967aa16f9', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', 'Vracet vrcholky do Strava', 'Vracet přes Strava API do Stravy zpět vrcholky k aktivitě', '{"TrailMetrics"}', 'done', '2026-01-19 18:38:11.249212+00', '2026-01-20 16:33:58.338+00', '{}'),
('ff8ec6af-2e62-4322-ad5a-3803cf84ab58', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', 'API mapy.com a napojení', E'https://developer.mapy.com/cs/rest-api/vibe-coding/\n', '{"TrailMetrics"}', 'todo', '2026-01-20 16:31:50.299657+00', '2026-01-23 08:04:51.627+00', '{"https://developer.mapy.com/cs/rest-api/vibe-coding/"}');

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
INSERT INTO subscriptions (id, user_id, created_at, name, amount, currency, frequency, category, next_billing_date, payment_type, priority, is_active) VALUES
('0df7b646-f4c7-4a6b-b7d9-a3569b13e045', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:41:06.114445+00', 'YouTube David Šetek', 150, 'CZK', 'monthly', 'Audio/Video', '2026-02-18', 'automatic', 3, true),
('2c74f7c4-d9c5-424a-8a85-cac5ccbf0455', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:43:11.884209+00', 'HBO Max', 109, 'CZK', 'monthly', 'Audio/Video', '2026-02-03', 'automatic', 3, true),
('7075e24d-c7c6-497b-a152-a8515278f18c', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:42:32.4813+00', 'Google One - Gemini', 550, 'CZK', 'monthly', 'AI', '2026-02-05', 'automatic', 2, true),
('7d621b5f-14aa-4057-9360-fac61925adbc', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:41:39.717764+00', 'Claude Code', 550, 'CZK', 'monthly', 'AI', '2026-02-19', 'automatic', 2, true),
('7eaaaf35-0f5c-420d-980f-a9369835d214', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:43:59.591562+00', 'YouTube Michal Ozogán', 29, 'CZK', 'monthly', 'Audio/Video', '2026-01-26', 'automatic', 3, true),
('c0d8f131-6e6e-471b-a25a-0666cbc61647', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:44:39.833521+00', 'RailWay', 110, 'CZK', 'monthly', 'Hosting', '2026-02-20', 'automatic', 1, true),
('cc75251e-fad9-4586-88b9-28ebb026fa0b', 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56', '2026-01-22 07:31:04.834183+00', 'YouTube Premium', 209, 'CZK', 'monthly', 'Ostatní', '2026-02-14', 'automatic', 1, true);

-- ============================================
-- HOTOVO!
--
-- Po importu a prvním přihlášení do Neon Auth
-- spusť tento UPDATE s novým user_id:
--
-- UPDATE ideas SET user_id = 'NOVY_NEON_USER_ID'
-- WHERE user_id = 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56';
--
-- UPDATE subscriptions SET user_id = 'NOVY_NEON_USER_ID'
-- WHERE user_id = 'ca8f5b02-1ff2-4ebc-a899-eab1f5ab9a56';
-- ============================================
