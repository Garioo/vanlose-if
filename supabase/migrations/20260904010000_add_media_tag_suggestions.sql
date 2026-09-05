-- Proposed media tags awaiting admin review.
--
-- Filled by scripts/face_tagger. Nothing is applied automatically: an admin
-- accepts or rejects each one, and the normal tag save path writes it.
--
-- Holds no biometric data, only a tag name and a score. Face embeddings stay
-- in a local gitignored file (see scripts/face_tagger/README.md).

CREATE TABLE IF NOT EXISTS public.media_tag_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id text NOT NULL REFERENCES public.media_assets(public_id) ON DELETE CASCADE,
  -- The proposed Cloudinary tag, e.g. a player name.
  tag text NOT NULL,
  -- 0..1.
  confidence real NOT NULL,
  -- 'pending' | 'accepted' | 'rejected'. Rejections are kept so a re-run does
  -- not propose the same wrong match again.
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
