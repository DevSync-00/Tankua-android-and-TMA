-- Remove confirmed exact-name duplicate destinations without losing references.
-- Source reviewed: destinations_rows (1).csv (1,261 rows).
-- Result: 14 canonical destinations retained; 15 duplicate rows removed.

BEGIN;

CREATE TEMP TABLE destination_duplicate_map (
  duplicate_id UUID PRIMARY KEY,
  canonical_id UUID NOT NULL
) ON COMMIT DROP;

INSERT INTO destination_duplicate_map (duplicate_id, canonical_id) VALUES
  ('069a3989-4cef-4a1f-9d1b-4adee39e6660', '9a43800e-30e2-4a59-9d66-8c4d960dcedc'), -- Science Museum Complex
  ('49fcedab-896b-4062-8db7-a86d91f9a0ad', '0ce80aca-c141-4001-bc27-6c5a65e10179'), -- Debre Damo Monastery
  ('10995a8c-f549-4261-9251-3c7e872b92b8', 'd6f4b506-358c-4c07-8613-545df8856a24'), -- Argobba Heritage Villages
  ('e29e1457-4de8-430d-af73-bfa7b7e3c8fc', '223f25d1-5c5f-4cb6-b2b5-718fbbe1049e'), -- Debre Birhan Selassie Church
  ('c69c8eff-ee2c-473f-8102-5e00f9f366f3', '2aa8c306-f01c-4159-9660-97d51d0e9e85'), -- Simien Mountains National Park
  ('30f7ccf6-0605-40f8-94e6-618b65f34410', '2fd27134-f9a9-43fb-8cbf-0db026e845c5'), -- Nechisar National Park & Bridge of God
  ('36a6ad45-50c4-466e-8ded-a3c27b7140fa', 'ec22ddef-81bc-4ab1-bc33-c3f8d72bf7c9'), -- Meskel Square Public Plaza
  ('6beb2067-f215-4d07-a80e-7c486a81a6f6', '3f2c87e1-1bac-426a-9621-ce3a8dac7828'), -- Holy Trinity Cathedral
  ('7cc14bb7-fbe0-4ee9-a700-0492dfcb447d', '557a17b5-eee4-4665-a580-c71b789db47e'), -- Fasilides Bathing Palace
  ('6beae27e-b640-4eab-8dc6-9cbe62a15b7b', '572d6693-ca59-48ac-aba4-e27bb9c81118'), -- Afar settlements
  ('7700497d-3c1e-4056-b314-3b8c7d6a7327', 'f90f12ec-fee1-49d6-8881-ca354b9dd890'), -- National Museum
  ('e81593e7-1a80-422a-806d-e7166b95dd4b', 'f90f12ec-fee1-49d6-8881-ca354b9dd890'), -- National Museum
  ('f42a7d8d-a948-4176-be13-0f4f36be34f3', '94d5c37d-fa37-40a2-ab31-54ebcb67a3c5'), -- Tut Fela
  ('de0111c1-703e-4a89-b998-99ca0df03a61', 'b4a07b20-3354-418a-a80b-17a2ac4d0189'), -- Ethnological Museum
  ('b6046336-8442-4977-850f-14dfd8c9d66f', 'fdde23d4-2203-4160-93cd-84a0d88274c5'); -- Friendship Park

-- Abort if a reviewed source or canonical UUID is missing.
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT count(*) INTO missing_count
  FROM destination_duplicate_map m
  LEFT JOIN public.destinations d1 ON d1.id = m.duplicate_id
  LEFT JOIN public.destinations d2 ON d2.id = m.canonical_id
  WHERE d1.id IS NULL OR d2.id IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Duplicate cleanup aborted: % mapping rows reference missing destinations', missing_count;
  END IF;
END $$;

-- Repoint relational references before deleting destinations.
UPDATE public.trips t
SET destination_id = m.canonical_id
FROM destination_duplicate_map m
WHERE t.destination_id = m.duplicate_id;

UPDATE public.bookings b
SET destination_id = m.canonical_id
FROM destination_duplicate_map m
WHERE b.destination_id = m.duplicate_id;

-- Preserve favorites while avoiding composite-primary-key conflicts.
DO $$
BEGIN
  IF to_regclass('public.user_favorites') IS NOT NULL THEN
    INSERT INTO public.user_favorites (user_id, destination_id, created_at)
    SELECT f.user_id, m.canonical_id, min(f.created_at)
    FROM public.user_favorites f
    JOIN destination_duplicate_map m ON m.duplicate_id = f.destination_id
    GROUP BY f.user_id, m.canonical_id
    ON CONFLICT (user_id, destination_id) DO NOTHING;

    DELETE FROM public.user_favorites f
    USING destination_duplicate_map m
    WHERE f.destination_id = m.duplicate_id;
  END IF;
END $$;

-- Older clients store favorites as UUID arrays on users. Replace and de-duplicate them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'saved_destinations' AND data_type = 'ARRAY'
  ) THEN
    UPDATE public.users u
    SET saved_destinations = COALESCE((
      SELECT array_agg(DISTINCT COALESCE(m.canonical_id, item.id))
      FROM unnest(u.saved_destinations) AS item(id)
      LEFT JOIN destination_duplicate_map m ON m.duplicate_id = item.id
    ), ARRAY[]::UUID[])
    WHERE EXISTS (
      SELECT 1 FROM unnest(u.saved_destinations) AS item(id)
      JOIN destination_duplicate_map m ON m.duplicate_id = item.id
    );
  END IF;
END $$;

DELETE FROM public.destinations d
USING destination_duplicate_map m
WHERE d.id = m.duplicate_id;

-- Enforce the same exact-name rule (case/outer whitespace insensitive) going forward.
CREATE UNIQUE INDEX IF NOT EXISTS destinations_name_exact_unique
  ON public.destinations (lower(btrim(name)));

COMMIT;

-- Verification query: should return zero rows.
SELECT lower(btrim(name)) AS normalized_name, count(*) AS row_count
FROM public.destinations
GROUP BY lower(btrim(name))
HAVING count(*) > 1;
