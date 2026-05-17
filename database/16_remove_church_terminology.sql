-- Migration 16: Remove church terminology from schema and data
-- Run after 15_generalize_to_all_tours.sql

-- Reclassify legacy category value
UPDATE destinations
SET category = 'religious'
WHERE category = 'church';

-- Update category constraint on destinations (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'destinations' AND column_name = 'category'
  ) THEN
    ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_category_check;
    ALTER TABLE destinations DROP CONSTRAINT IF EXISTS churches_category_check;
    ALTER TABLE destinations ADD CONSTRAINT destinations_category_check
      CHECK (category IN (
        'religious', 'historical', 'nature', 'adventure', 'cultural',
        'sacred', 'monument', 'park', 'museum', 'city', 'other'
      ));
  END IF;
END $$;

-- Promotions: applicable_churches → applicable_destinations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'applicable_churches'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'applicable_destinations'
  ) THEN
    ALTER TABLE promotions RENAME COLUMN applicable_churches TO applicable_destinations;
  END IF;
END $$;

-- Drop legacy churches table if destinations exists (post-migration 15)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'destinations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'churches') THEN
    DROP TABLE churches CASCADE;
  END IF;
END $$;

-- Rename legacy storage policies referencing churches bucket (optional; create destinations bucket in Supabase UI)
COMMENT ON TABLE destinations IS 'Travel destinations and points of interest';
