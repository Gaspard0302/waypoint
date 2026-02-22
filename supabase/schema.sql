-- Waypoint Database Schema
-- Paste and run this in the Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Plans: billing tier per user (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier        TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Sites: websites registered by users
CREATE TABLE IF NOT EXISTS sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  api_key     UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crawl jobs: tracks indexing job status per site
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  triggered_by TEXT NOT NULL DEFAULT 'manual' CHECK (triggered_by IN ('manual', 'webhook')),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site index: one row per crawled page
CREATE TABLE IF NOT EXISTS site_index (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  crawl_job_id   UUID REFERENCES crawl_jobs(id) ON DELETE SET NULL,
  parent_id      UUID REFERENCES site_index(id) ON DELETE SET NULL,  -- tree structure
  route          TEXT NOT NULL,
  title          TEXT,
  depth          INTEGER NOT NULL DEFAULT 0,
  elements       JSONB NOT NULL DEFAULT '[]',  -- interactive elements with selectors + actions
  screenshot_url TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions: anonymous visitor widget sessions
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id  TEXT,  -- anonymous fingerprint, optional
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages: chat history per session
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  action      JSONB,  -- action payload if assistant triggered an action
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sites_user_id       ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_api_key       ON sites(api_key);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_site_id  ON crawl_jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_site_index_site_id  ON site_index(site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_site_id    ON sessions(site_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_index  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages    ENABLE ROW LEVEL SECURITY;

-- Plans: users can only see their own plan
CREATE POLICY "plans: owner access" ON plans
  FOR ALL USING (auth.uid() = user_id);

-- Sites: users can only see/modify their own sites
CREATE POLICY "sites: owner access" ON sites
  FOR ALL USING (auth.uid() = user_id);

-- Crawl jobs: accessible via site ownership
CREATE POLICY "crawl_jobs: owner access" ON crawl_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites WHERE sites.id = crawl_jobs.site_id AND sites.user_id = auth.uid()
    )
  );

-- Site index: accessible via site ownership
CREATE POLICY "site_index: owner access" ON site_index
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites WHERE sites.id = site_index.site_id AND sites.user_id = auth.uid()
    )
  );

-- Sessions: accessible via site ownership
CREATE POLICY "sessions: owner access" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sites WHERE sites.id = sessions.site_id AND sites.user_id = auth.uid()
    )
  );

-- Messages: accessible via session → site ownership
CREATE POLICY "messages: owner access" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN sites ON sites.id = sessions.site_id
      WHERE sessions.id = messages.session_id AND sites.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: auto-create plans row on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.plans (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
