-- Mirror of the Cloudinary media library.
--
-- The admin media library used to list and filter by calling the Cloudinary
-- Admin API on every request: two calls per page load (image + video) at
-- ~1.5s each, capped at 200 results, with multi-tag filtering done in memory
-- after that cap had already truncated the set. The Admin API is also rate
-- limited (500 requests/hour), which a tagging session burns through quickly.
--
-- Cloudinary remains the source of truth for the files themselves. This table
-- mirrors only the metadata needed to list, filter and search, so the grid is
-- one indexed query instead of several remote calls.

CREATE TABLE IF NOT EXISTS public.media_assets (
  -- Cloudinary public_id, e.g. "vanlose-if/2026-05-02 Hørsholm/IMG_0322".
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
  -- Upload time as reported by Cloudinary; the grid is sorted newest first.
  created_at timestamp with time zone NOT NULL,
  -- When this row last matched Cloudinary. Lets a sync detect stale rows.
  synced_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Multi-tag filtering is `tags @> ARRAY[...]`, which needs a GIN index.
CREATE INDEX IF NOT EXISTS media_assets_tags_idx ON public.media_assets USING GIN (tags);
CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets (folder);
CREATE INDEX IF NOT EXISTS media_assets_created_at_idx ON public.media_assets (created_at DESC);

-- The media library is admin-only, so unlike the public content tables this
-- one deliberately gets no SELECT policy: with RLS on and no policy, the anon
-- key can read nothing and only the service role (used by the API routes)
-- has access.
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
