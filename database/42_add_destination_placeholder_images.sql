-- ============================================
-- ADD PLACEHOLDER IMAGES FOR DESTINATIONS MISSING IMAGES
-- Run this migration in the Supabase SQL editor to populate images for destinations that don't have them.
-- ============================================

-- 1. Update religious/sacred destinations with religious placeholders
UPDATE public.destinations
SET images = ARRAY[
  'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800', -- Axum St. Mary / Church
  'https://images.unsplash.com/photo-1605106901227-991bd663255c?w=800'  -- Bahir Dar Lake Tana Church
]
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%')
  AND (category IN ('religious', 'sacred', 'church'));

-- 2. Update historical/monument/museum/cultural destinations with historical placeholders
UPDATE public.destinations
SET images = ARRAY['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'] -- Gondar Castle
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%')
  AND (category IN ('historical', 'monument', 'museum', 'cultural'));

-- 3. Update nature/park destinations with nature placeholders
UPDATE public.destinations
SET images = ARRAY[
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800', -- Simien Mountains landscape
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'  -- Lush highlands
]
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%')
  AND (category IN ('nature', 'park'));

-- 4. Update adventure destinations with adventure placeholders
UPDATE public.destinations
SET images = ARRAY['https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800'] -- Danakil Depression
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%')
  AND (category = 'adventure');

-- 5. Update city destinations with city placeholders
UPDATE public.destinations
SET images = ARRAY['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800'] -- Addis Ababa
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%')
  AND (category = 'city');

-- 6. Update any other destinations with default placeholder
UPDATE public.destinations
SET images = ARRAY['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'] -- Rift Valley Safari
WHERE (images IS NULL OR images = '{}'::text[] OR array_length(images, 1) IS NULL OR images[1] LIKE '%wikimedia.org%' OR images[1] LIKE '%wikipedia.org%');
