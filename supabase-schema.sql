-- Supabase SQL Schema for Vanlose IF
-- Re-runnable schema + migration script.

-- 1. Create 'articles' table
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  date text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  image_url text,
  latest boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'players' table
CREATE TABLE IF NOT EXISTS public.players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  number text NOT NULL,
  name text NOT NULL,
  position text NOT NULL,
  image_url text
);

-- 3. Create 'teams' table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  abbreviation text,
  logo_url text,
  home_turf text
);

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS abbreviation text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS home_turf text;

-- 4. Create 'matches' table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  time text,
  kickoff_at timestamp with time zone,
  status text NOT NULL DEFAULT 'scheduled',
  live_phase text NOT NULL DEFAULT 'pre_match',
  live_minute integer,
  live_clock_running boolean NOT NULL DEFAULT false,
  live_clock_started_at timestamp with time zone,
  live_clock_accumulated_seconds integer NOT NULL DEFAULT 0,
  period_label text,
  matchday_notes text,
  home text NOT NULL,
  home_team_id uuid,
  away text NOT NULL,
  away_team_id uuid,
  venue text,
  home_score integer,
  away_score integer,
  result text, -- 'win', 'draw', 'loss'
  is_upcoming boolean DEFAULT true NOT NULL
);

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS kickoff_at timestamp with time zone;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_phase text NOT NULL DEFAULT 'pre_match';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_minute integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_clock_running boolean NOT NULL DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_clock_started_at timestamp with time zone;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_clock_accumulated_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS period_label text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS matchday_notes text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_team_id uuid;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_team_id uuid;

DO $$
BEGIN
  ALTER TABLE public.matches
    ADD CONSTRAINT matches_status_check
    CHECK (status IN ('scheduled', 'live', 'finished'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.matches
    ADD CONSTRAINT matches_live_phase_check
    CHECK (live_phase IN ('pre_match', 'first_half', 'halftime', 'second_half', 'fulltime'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create 'standings' table
CREATE TABLE IF NOT EXISTS public.standings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pos integer NOT NULL,
  team text NOT NULL,
  team_id uuid,
  played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  goals_scored integer NOT NULL DEFAULT 0,
  goals_conceded integer NOT NULL DEFAULT 0,
  pts integer NOT NULL DEFAULT 0,
  highlight boolean DEFAULT false NOT NULL
);

ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS goals_scored integer NOT NULL DEFAULT 0;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS goals_conceded integer NOT NULL DEFAULT 0;
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS highlight boolean NOT NULL DEFAULT false;

-- 6. Submission inbox tables
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.membership_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  membership_tier text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_side text NOT NULL,
  event_type text NOT NULL,
  minute integer,
  stoppage_minute integer,
  player_name text,
  assist_name text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  ALTER TABLE public.match_events
    ADD CONSTRAINT match_events_team_side_check
    CHECK (team_side IN ('home', 'away'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.match_events
    ADD CONSTRAINT match_events_event_type_check
    CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'kickoff', 'halftime', 'fulltime'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.match_lineups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_side text NOT NULL,
  formation text,
  starters jsonb NOT NULL DEFAULT '[]'::jsonb,
  bench jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  ALTER TABLE public.match_lineups
    ADD CONSTRAINT match_lineups_team_side_check
    CHECK (team_side IN ('home', 'away'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS match_lineups_match_side_unique_idx
  ON public.match_lineups (match_id, team_side);

DO $$
BEGIN
  ALTER TABLE public.contact_submissions
    ADD CONSTRAINT contact_submissions_status_check
    CHECK (status IN ('new', 'handled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.volunteer_submissions
    ADD CONSTRAINT volunteer_submissions_status_check
    CHECK (status IN ('new', 'handled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.membership_submissions
    ADD CONSTRAINT membership_submissions_status_check
    CHECK (status IN ('new', 'handled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON public.contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx
  ON public.contact_submissions (status);

CREATE INDEX IF NOT EXISTS volunteer_submissions_created_at_idx
  ON public.volunteer_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS volunteer_submissions_status_idx
  ON public.volunteer_submissions (status);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_created_at_idx
  ON public.newsletter_subscriptions (created_at DESC);

CREATE INDEX IF NOT EXISTS membership_submissions_created_at_idx
  ON public.membership_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS membership_submissions_status_idx
  ON public.membership_submissions (status);

CREATE INDEX IF NOT EXISTS match_events_match_minute_created_idx
  ON public.match_events (match_id, minute, created_at);

CREATE INDEX IF NOT EXISTS match_lineups_match_side_idx
  ON public.match_lineups (match_id, team_side);

-- Foreign key constraints (idempotent)
DO $$
BEGIN
  ALTER TABLE public.matches
    ADD CONSTRAINT matches_home_team_id_fkey
    FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.matches
    ADD CONSTRAINT matches_away_team_id_fkey
    FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.standings
    ADD CONSTRAINT standings_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill relation ids from existing team names
UPDATE public.matches m
SET home_team_id = t.id
FROM public.teams t
WHERE m.home_team_id IS NULL
  AND lower(trim(m.home)) = lower(trim(t.name));

UPDATE public.matches m
SET away_team_id = t.id
FROM public.teams t
WHERE m.away_team_id IS NULL
  AND lower(trim(m.away)) = lower(trim(t.name));

UPDATE public.standings s
SET team_id = t.id
FROM public.teams t
WHERE s.team_id IS NULL
  AND lower(trim(s.team)) = lower(trim(t.name));

-- Backfill kickoff_at for common date formats
UPDATE public.matches
SET kickoff_at = to_timestamp(
  date || ' ' || COALESCE(NULLIF(time, ''), '12:00'),
  'YYYY-MM-DD HH24:MI'
)
WHERE kickoff_at IS NULL
  AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';

-- Membership tiers
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price text NOT NULL,
  unit text NOT NULL DEFAULT 'kr/år',
  description text NOT NULL,
  perks text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Volunteer roles
CREATE TABLE IF NOT EXISTS public.volunteer_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  tasks text[] NOT NULL DEFAULT '{}',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  label text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.site_settings (key, value, label) VALUES
  ('current_season', '2024/25', 'Aktuel sæson (f.eks. 2024/25)'),
  ('contact_phone', '+45 38 74 12 12', 'Telefon'),
  ('contact_email', 'kontakt@vanlosif.dk', 'E-mail'),
  ('contact_address', 'Klampegårdsvej 4-6, 2720 Vanløse', 'Adresse'),
  ('klubben_hero_image_1', '', 'Klubben Hero — Billede 1 (øverst)'),
  ('klubben_hero_image_2', '', 'Klubben Hero — Billede 2 (midten)'),
  ('klubben_hero_image_3', '', 'Klubben Hero — Billede 3 (nederst)'),
  ('klubben_era_1_image', '', 'Arkiv — De Første År (1921–1950)'),
  ('klubben_era_2_image', '', 'Arkiv — Guldalderen (1951–1990)'),
  ('klubben_era_3_image', '', 'Arkiv — Moderne Tid (1991–nu)'),
  ('hero_image_url', '', 'Forside — Hero-billede'),
  ('forsteholdet_hero_image', '', 'Førsteholdet — Hero-billede'),
  ('ungdom_hero_image', '', 'Ungdom — Hero-billede'),
  ('ungdom_bornefodbold_image', '', 'Ungdom — Børnefodbold-billede'),
  ('ungdom_elite_image', '', 'Ungdom — Elite Ungdom-billede'),
  ('frivillig_hero_image', '', 'Frivillig — Hero-billede'),
  ('volunteer_image', '', 'Forside — Frivillig-sektion billede'),
  ('youth_image', '', 'Forside — Ungdomssektion billede')
ON CONFLICT (key) DO NOTHING;

UPDATE public.matches
SET kickoff_at = to_timestamp(
  date || ' ' || COALESCE(NULLIF(time, ''), '12:00'),
  'DD.MM.YYYY HH24:MI'
)
WHERE kickoff_at IS NULL
  AND date ~ '^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}$';

-- Backfill live clock defaults/state
UPDATE public.matches
SET live_phase = CASE
  WHEN status = 'finished' THEN 'fulltime'
  WHEN status = 'live' THEN 'first_half'
  ELSE 'pre_match'
END
WHERE live_phase IS NULL
   OR live_phase NOT IN ('pre_match', 'first_half', 'halftime', 'second_half', 'fulltime');

UPDATE public.matches
SET live_clock_accumulated_seconds = COALESCE(live_clock_accumulated_seconds, COALESCE(live_minute, 0) * 60)
WHERE live_clock_accumulated_seconds IS NULL
   OR live_clock_accumulated_seconds < 0;

UPDATE public.matches
SET live_clock_running = false
WHERE live_clock_running IS NULL;

-- ==========================================
-- NEW FEATURE TABLES
-- ==========================================

-- Sponsors
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  website_url text,
  tier text NOT NULL CHECK (tier IN ('guld', 'sølv', 'bronze')),
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Youth teams
CREATE TABLE IF NOT EXISTS public.youth_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  age_group text NOT NULL,
  coach text,
  training_schedule text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Player stats
CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season text NOT NULL,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  appearances int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(player_id, season)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Public read access to site-facing tables
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.articles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.articles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.players;
CREATE POLICY "Public profiles are viewable by everyone." ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.matches;
CREATE POLICY "Public profiles are viewable by everyone." ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.standings;
CREATE POLICY "Public profiles are viewable by everyone." ON public.standings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.teams;
CREATE POLICY "Public profiles are viewable by everyone." ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.match_events;
CREATE POLICY "Public profiles are viewable by everyone." ON public.match_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.match_lineups;
CREATE POLICY "Public profiles are viewable by everyone." ON public.match_lineups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.sponsors;
CREATE POLICY "Public profiles are viewable by everyone." ON public.sponsors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.youth_teams;
CREATE POLICY "Public profiles are viewable by everyone." ON public.youth_teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.player_stats;
CREATE POLICY "Public profiles are viewable by everyone." ON public.player_stats FOR SELECT USING (true);

-- Remove permissive write policies on core tables (writes are now API + service role only)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.articles;
DROP POLICY IF EXISTS "Enable update for all users" ON public.articles;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.articles;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.players;
DROP POLICY IF EXISTS "Enable update for all users" ON public.players;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.players;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable update for all users" ON public.matches;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.matches;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.standings;
DROP POLICY IF EXISTS "Enable update for all users" ON public.standings;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.standings;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.teams;
DROP POLICY IF EXISTS "Enable update for all users" ON public.teams;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.teams;

-- Submission tables are private; no anon read/write policies.

NOTIFY pgrst, 'reload schema';

-- Distributed rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_start_idx
  ON public.rate_limit_buckets (window_start);

CREATE OR REPLACE FUNCTION public.rate_limit_increment(
  p_key text,
  p_window_ms bigint
) RETURNS TABLE(count integer, window_start timestamptz)
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.rate_limit_buckets rlb
  WHERE rlb.id = p_key
    AND rlb.window_start + (p_window_ms || ' milliseconds')::interval < now();

  INSERT INTO public.rate_limit_buckets (id, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (id) DO UPDATE
    SET count = rate_limit_buckets.count + 1;

  RETURN QUERY
    SELECT b.count, b.window_start
    FROM public.rate_limit_buckets b
    WHERE b.id = p_key;
END;
$$;

-- Images are stored in Cloudinary under the vanlose-if/ folder.
-- No Supabase Storage bucket is required.

-- Playoff split: grundspil / oprykningsspil / nedrykningsspil
ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS gruppe text NOT NULL DEFAULT 'regular';

-- Social media links (managed via admin indstillinger)
INSERT INTO public.site_settings (key, value, label) VALUES
  ('social_instagram', '', 'Instagram URL'),
  ('social_facebook', '', 'Facebook URL'),
  ('social_youtube', '', 'YouTube URL')
ON CONFLICT (key) DO NOTHING;
