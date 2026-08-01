-- Representative fallback covers for destinations that still have no images.
-- Run destination_images_001_200_uploaded.sql first so exact matches win.
BEGIN;

-- Lakes, boating, ferries, and cruises.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/gorgora-northern-lake-tana-dock/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('cruise');

-- Churches, monasteries, heritage, ancestry, monuments, and museums.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/lalibela-rock-hewn-churches-bete-giyorgis-etc/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('religious', 'ancestry', 'historical', 'monument', 'museum', 'sacred');

-- Parks, wildlife, ecotourism, and nature.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/chebera-churchura-national-park/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('ecotourism', 'wildlife', 'nature', 'park');

-- Adventure, photography, night-sky, and space experiences.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/erta-ale-active-volcano-lava-hazards-field/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('adventure', 'photography', 'dark', 'space');

-- Rural, farming, culture, food, and volunteer experiences.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/harari-rural-farming-outskirts/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('rural', 'agritourism', 'voluntourism', 'cultural', 'culinary');

-- Cities, commerce, accommodation, shopping, and accessibility.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/addis-ababa-city-center-meskel-square-imperial-zones/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('urban', 'business', 'budget', 'luxury', 'accessible', 'shopping', 'other', 'city');

-- Health, education, and wellness facilities.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/dil-chora-hospital/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('medical', 'educational', 'wellness');

-- Sports and training destinations.
UPDATE public.destinations
SET images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/yaya-africa-athletics-village/cover.webp']::text[]
WHERE COALESCE(cardinality(images), 0) = 0
  AND category IN ('sports');

COMMIT;
