-- Mirror of the Cloudinary media library.
--
-- Listing used to call the Cloudinary Admin API per request: two calls per page
-- load at ~1.5s each, capped at 200 results, with multi-tag filtering done in
-- memory after that cap had already truncated the set. The Admin API is also
-- rate limited to 500 requests/hour, which a tagging session burns through.
--
-- Cloudinary still stores the files. This mirrors only the metadata needed to
-- list and filter, so the grid is one indexed query.

CREATE TABLE IF NOT EXISTS public.media_assets (
  -- e.g. "vanlose-if/2026-05-02 Hørsholm/IMG_0322".
  public_id text PRIMARY KEY,
  url text NOT NULL,
  resource_type text NOT NULL DEFAULT 'image',
  format text,
  -- Subfolder below "vanlose-if/", or NULL for assets sitting at the root.
  folder text,
  tags text[] NOT NULL DEFAULT '{}',
  bytes bigint NOT NULL DEFAULT 0,
  width integer,
  height integer,
  -- Cloudinary's upload time; the grid sorts newest first.
  created_at timestamp with time zone NOT NULL,
  -- When this row last matched Cloudinary.
  synced_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Multi-tag filtering is `tags @> ARRAY[...]`, which needs a GIN index.
CREATE INDEX IF NOT EXISTS media_assets_tags_idx ON public.media_assets USING GIN (tags);
CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets (folder);
CREATE INDEX IF NOT EXISTS media_assets_created_at_idx ON public.media_assets (created_at DESC);

-- Admin-only, unlike the public content tables: RLS on with no SELECT policy
-- means the anon key reads nothing and only the service role has access.
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
