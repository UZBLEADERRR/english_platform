-- =============================================
-- MUHIM: Buni Supabase SQL Editor ga kiriting va RUN bosing!
-- =============================================

-- 1. Login codes jadvali (brauzerdan kirish uchun)
CREATE TABLE IF NOT EXISTS public.login_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  telegram_id bigint NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Movies jadvaliga barcha kerakli ustunlar
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS info_html text;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS telegram_code text;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS telegram_file_id text;

-- 3. Users jadvaliga yangi ustunlar
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_expiry_reminder timestamptz;

-- 4. Vocabulary words jadvali
CREATE TABLE IF NOT EXISTS public.vocabulary_words (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE,
  english text NOT NULL,
  uzbek text NOT NULL,
  example text,
  synonyms jsonb DEFAULT '[]'::jsonb,
  antonyms jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vocabulary_words_topic_id_idx ON public.vocabulary_words(topic_id);

-- 5. RLS for login_codes
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON public.login_codes FOR ALL USING (true) WITH CHECK (true);

-- Done!
