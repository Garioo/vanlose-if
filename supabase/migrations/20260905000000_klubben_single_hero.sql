-- Klubben-siden bruger nu ét enkelt hero-billede i stedet for tre stablede.
-- Værdien fra det øverste billede overføres, så siden ikke står tom efter deploy.

INSERT INTO public.site_settings (key, value, label)
SELECT
  'klubben_hero_image',
  COALESCE((SELECT value FROM public.site_settings WHERE key = 'klubben_hero_image_1'), ''),
  'Klubben — Hero-billede'
ON CONFLICT (key) DO NOTHING;

DELETE FROM public.site_settings
WHERE key IN ('klubben_hero_image_1', 'klubben_hero_image_2', 'klubben_hero_image_3');
