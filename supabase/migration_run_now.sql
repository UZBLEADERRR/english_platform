-- =============================================
-- Migration: Vocabulary, Stories, Sessions
-- =============================================

-- 1. Vocabulary: misol tarjimasi
ALTER TABLE vocabulary_words ADD COLUMN IF NOT EXISTS example_translation TEXT;

-- 2. Comics → Stories: HTML kod qo'llab-quvvatlash
ALTER TABLE comics ADD COLUMN IF NOT EXISTS html_code TEXT;

-- 3. Sessiya limiti
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_type TEXT DEFAULT 'browser',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
