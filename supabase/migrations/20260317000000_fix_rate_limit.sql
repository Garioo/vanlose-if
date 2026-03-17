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
