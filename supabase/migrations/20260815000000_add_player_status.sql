-- Adds a lifecycle status to players so people who have left the club can be
-- retired from the public squad without deleting them. Their profile page,
-- photo, stats and historical lineup/event references all stay intact.
--
--   status    'active'      — in the current squad (default for every existing row)
--             'transferred' — moved to another club
--             'retired'     — stopped playing
--   new_club  optional name of the club they moved to (transferred only)
--   left_at   optional date they left

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS new_club text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS left_at date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_status_check') THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_status_check
      CHECK (status IN ('active', 'transferred', 'retired'));
  END IF;
END $$;

-- The public squad query filters on this column on every page load.
CREATE INDEX IF NOT EXISTS players_status_idx ON public.players (status);
