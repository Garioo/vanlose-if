-- ============================================================================
-- Multi-season migration
-- Run this ONCE in the Supabase SQL editor before deploying the multi-season
-- code. It is idempotent (safe to run more than once).
--
-- Adds a `season` column to matches + standings, indexes them, and backfills
-- every existing row with the current season so nothing disappears.
-- ============================================================================

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS season text;
CREATE INDEX IF NOT EXISTS matches_season_idx ON public.matches (season);

ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS season text;
CREATE INDEX IF NOT EXISTS standings_season_idx ON public.standings (season);

-- Competition type: 'league' (default) or 'cup' (Pokalkamp).
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_type text NOT NULL DEFAULT 'league';

-- Backfill: tag all pre-existing rows with the current season.
UPDATE public.matches
  SET season = (SELECT value FROM public.site_settings WHERE key = 'current_season')
  WHERE season IS NULL;

UPDATE public.standings
  SET season = (SELECT value FROM public.site_settings WHERE key = 'current_season')
  WHERE season IS NULL;
