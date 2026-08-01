-- Remove only the generic category fallback images.
-- Exact destination-specific images and all other image URLs are preserved.

BEGIN;

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/gorgora-northern-lake-tana-dock/cover.webp']::text[]
  AND name <> 'Gorgora Northern Lake Tana Dock';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/lalibela-rock-hewn-churches-bete-giyorgis-etc/cover.webp']::text[]
  AND name <> 'Lalibela Rock-Hewn Churches (Bete Giyorgis, etc.)';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/chebera-churchura-national-park/cover.webp']::text[]
  AND name <> 'Chebera Churchura National Park';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/erta-ale-active-volcano-lava-hazards-field/cover.webp']::text[]
  AND name <> 'Erta Ale Active Volcano Lava Hazards Field';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/harari-rural-farming-outskirts/cover.webp']::text[]
  AND name <> 'Harari Rural Farming Outskirts';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/addis-ababa-city-center-meskel-square-imperial-zones/cover.webp']::text[]
  AND name <> 'Addis Ababa City Center (Meskel Square & Imperial Zones)';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/dil-chora-hospital/cover.webp']::text[]
  AND name <> 'Dil Chora Hospital';

UPDATE public.destinations
SET images = ARRAY[]::text[]
WHERE images = ARRAY['https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/yaya-africa-athletics-village/cover.webp']::text[]
  AND name <> 'Yaya Africa Athletics Village';

COMMIT;

-- Should return zero rows after cleanup.
SELECT id, name, images
FROM public.destinations
WHERE images && ARRAY[
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/gorgora-northern-lake-tana-dock/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/lalibela-rock-hewn-churches-bete-giyorgis-etc/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/chebera-churchura-national-park/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/erta-ale-active-volcano-lava-hazards-field/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/harari-rural-farming-outskirts/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/addis-ababa-city-center-meskel-square-imperial-zones/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/dil-chora-hospital/cover.webp',
  'https://dotjlikaurcjwabarqcy.supabase.co/storage/v1/object/public/destinations/yaya-africa-athletics-village/cover.webp'
]::text[]
AND name NOT IN (
  'Gorgora Northern Lake Tana Dock',
  'Lalibela Rock-Hewn Churches (Bete Giyorgis, etc.)',
  'Chebera Churchura National Park',
  'Erta Ale Active Volcano Lava Hazards Field',
  'Harari Rural Farming Outskirts',
  'Addis Ababa City Center (Meskel Square & Imperial Zones)',
  'Dil Chora Hospital',
  'Yaya Africa Athletics Village'
);
