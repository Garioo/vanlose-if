-- Proposed media tags awaiting admin review.
--
-- Filled by scripts/face_tagger, which matches faces in the media library
-- against reference embeddings built from photos an admin already tagged.
-- Suggestions are never applied automatically: a wrong player tag is worse
-- than a missing one, so an admin accepts or rejects each one and the normal
-- tag save path is what actually writes to Cloudinary.
--
-- Note this table holds no biometric data — only a tag name and a score. The
-- face embeddings stay in a local, gitignored file on the machine that runs
-- the script (see scripts/face_tagger/README.md).

CREATE TABLE IF NOT EXISTS public.media_tag_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id text NOT NULL REFERENCES public.media_assets(public_id) ON DELETE CASCADE,
  -- The Cloudinary tag being proposed, e.g. a player name.
  tag text NOT NULL,
  -- Cosine similarity against the player's reference face, 0..1.
  confidence real NOT NULL,
  -- 'pending' | 'accepted' | 'rejected'. Rejections are kept, not deleted, so
  -- a re-run does not propose the same wrong match again.
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'face',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  UNIQUE (public_id, tag)
);

CREATE INDEX IF NOT EXISTS media_tag_suggestions_status_idx
  ON public.media_tag_suggestions (status);
CREATE INDEX IF NOT EXISTS media_tag_suggestions_public_id_idx
  ON public.media_tag_suggestions (public_id);

-- Admin-only, like media_assets: RLS on, no policy, service role only.
ALTER TABLE public.media_tag_suggestions ENABLE ROW LEVEL SECURITY;
