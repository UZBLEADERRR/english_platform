-- ============================================
-- English Learning Platform - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'premium', 'ultra')),
  subscription_expires_at TIMESTAMPTZ,
  ai_credits_used INTEGER DEFAULT 0,
  ai_messages_today INTEGER DEFAULT 0,
  ai_messages_reset_at TIMESTAMPTZ DEFAULT NOW(),
  grammar_checks_today INTEGER DEFAULT 0,
  grammar_checks_reset_at TIMESTAMPTZ DEFAULT NOW(),
  artifacts_created INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CAROUSEL IMAGES
-- ============================================
CREATE TABLE carousel_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORY CARDS (Home page)
-- ============================================
CREATE TABLE category_cards (
  id TEXT PRIMARY KEY, -- grammar, reading, writing, etc.
  image_url TEXT,
  custom_name TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO category_cards (id, custom_name, sort_order) VALUES
  ('grammar', 'Grammar', 1),
  ('reading', 'Reading', 2),
  ('writing', 'Writing', 3),
  ('listening', 'Listening', 4),
  ('speaking', 'Speaking', 5),
  ('vocabulary', 'Vocabulary', 6),
  ('movies', 'Movies', 7),
  ('comics', 'Comics', 8),
  ('grammar_checker', 'Grammar Checker', 9),
  ('tips', 'Tips', 10);

-- ============================================
-- 4. LEVELS (6 per category)
-- ============================================
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id TEXT NOT NULL REFERENCES category_cards(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, level_number)
);

-- ============================================
-- 5. TOPICS (inside levels)
-- ============================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LESSON ELEMENTS (inside topics - drag & drop content)
-- ============================================
CREATE TABLE lesson_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN (
    'text', 'image', 'video', 'audio', 'strategy', 
    'example', 'exception', 'mistake', 'webview', 
    'quiz', 'link', 'divider'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  -- content structure depends on type:
  -- text: { text, color, style }
  -- image: { url, caption }
  -- video: { url, caption }
  -- audio: { url, caption }
  -- strategy: { title, text, color }
  -- example: { title, text, color }
  -- exception: { title, text, color }
  -- mistake: { title, text, color }
  -- webview: { html_code }
  -- quiz: { question, options[], correct_index, explanation }
  -- link: { url, label, is_webapp }
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MOVIES
-- ============================================
CREATE TABLE movie_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES movie_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  video_url TEXT, -- bunny.net URL
  is_18plus BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movie_carousel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. COMICS
-- ============================================
CREATE TABLE comics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comic_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id UUID NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comic_id, page_number)
);

-- ============================================
-- 9. TIPS
-- ============================================
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cover_image_url TEXT,
  content_type TEXT DEFAULT 'webview' CHECK (content_type IN ('webview', 'text', 'mixed')),
  html_code TEXT,
  text_content TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. APPS (formerly Artifacts)
-- ============================================
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  icon_url TEXT,
  app_type TEXT DEFAULT 'code' CHECK (app_type IN ('code', 'link')),
  html_code TEXT,
  link_url TEXT,
  is_admin_app BOOLEAN DEFAULT TRUE, -- true = "Kerakli ilovalar", false = user-created
  is_locked BOOLEAN DEFAULT FALSE, -- Bepul foydalanuvchilar kira oladimi?
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. REELS (Vocabulary)
-- ============================================
CREATE TABLE reel_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reel_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES reel_categories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  word TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_known_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES reel_words(id) ON DELETE CASCADE,
  is_known BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- ============================================
-- 12. PAYMENTS
-- ============================================
CREATE TABLE payment_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number TEXT NOT NULL,
  card_holder TEXT NOT NULL,
  bank_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'ultra')),
  amount DECIMAL(10,2),
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  card_id UUID REFERENCES payment_cards(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- 13. REFERRAL LINKS
-- ============================================
CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  clicks INTEGER DEFAULT 0,
  registrations INTEGER DEFAULT 0,
  payments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. CHAT SESSIONS
-- ============================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14b. TOKEN USAGE TRACKING
-- ============================================
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT,
  endpoint TEXT, -- 'chat', 'grammar', 'reels'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_user ON token_usage(user_id);
CREATE INDEX idx_token_usage_created ON token_usage(created_at);

-- ============================================
-- 15. USER PROGRESS
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comic_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_known_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Public read policies for content tables
CREATE POLICY "Public read carousel" ON carousel_images FOR SELECT USING (is_active = true);
CREATE POLICY "Public read categories" ON category_cards FOR SELECT USING (true);
CREATE POLICY "Public read levels" ON levels FOR SELECT USING (true);
CREATE POLICY "Public read topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON lesson_elements FOR SELECT USING (true);
CREATE POLICY "Public read movies" ON movies FOR SELECT USING (is_active = true);
CREATE POLICY "Public read movie_categories" ON movie_categories FOR SELECT USING (true);
CREATE POLICY "Public read movie_carousel" ON movie_carousel FOR SELECT USING (is_active = true);
CREATE POLICY "Public read comics" ON comics FOR SELECT USING (is_active = true);
CREATE POLICY "Public read comic_pages" ON comic_pages FOR SELECT USING (true);
CREATE POLICY "Public read tips" ON tips FOR SELECT USING (is_active = true);
CREATE POLICY "Public read apps" ON apps FOR SELECT USING (is_active = true);
CREATE POLICY "Public read reel_categories" ON reel_categories FOR SELECT USING (true);
CREATE POLICY "Public read reel_words" ON reel_words FOR SELECT USING (true);
CREATE POLICY "Public read payment_cards" ON payment_cards FOR SELECT USING (is_active = true);

-- User policies
CREATE POLICY "Users read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (telegram_id = current_setting('app.current_user_telegram_id')::BIGINT);

-- Service role can do everything (used by server)
-- These will be handled by the service_role key on the server side

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_levels_category ON levels(category_id);
CREATE INDEX idx_topics_level ON topics(level_id);
CREATE INDEX idx_lesson_elements_topic ON lesson_elements(topic_id);
CREATE INDEX idx_movies_category ON movies(category_id);
CREATE INDEX idx_comic_pages_comic ON comic_pages(comic_id);
CREATE INDEX idx_reel_words_category ON reel_words(category_id);
CREATE INDEX idx_user_known_words_user ON user_known_words(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- ============================================
-- 17. SONGS
-- ============================================
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  cover_url TEXT,
  media_type TEXT DEFAULT 'audio', -- 'audio' or 'video'
  media_url TEXT,
  lyrics_html TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. LIBRARY (Books & Materials)
-- ============================================
CREATE TABLE library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  pdf_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. PRICING CONFIG
-- ============================================
CREATE TABLE pricing_config (
  id TEXT PRIMARY KEY, -- 'free', 'premium', 'ultra'
  name TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'so''m',
  daily_messages INTEGER DEFAULT 3,
  daily_grammar INTEGER DEFAULT 1,
  max_artifacts INTEGER DEFAULT 1,
  features TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO pricing_config (id, name, price, daily_messages, daily_grammar, max_artifacts, features, sort_order) VALUES
  ('free', 'Bepul', 0, 3, 1, 1, 'Asosiy chatbot, 1 ta ilova', 0),
  ('premium', 'Premium', 29000, 20, 5, 1, 'AI Chat 20 msg, Grammar 5x, Kinolar, Comics, Darslar', 1),
  ('ultra', 'Ultra', 49000, 999999, 999999, 999999, 'CHEKSIZ hammasi', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET ai_messages_today = 0, 
      ai_messages_reset_at = NOW(),
      grammar_checks_today = 0,
      grammar_checks_reset_at = NOW()
  WHERE ai_messages_reset_at < NOW() - INTERVAL '1 day'
     OR grammar_checks_reset_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
