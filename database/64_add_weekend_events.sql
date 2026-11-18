BEGIN;

CREATE TABLE public.weekend_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (
    char_length(slug) <= 96 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 1000),
  start_date DATE NOT NULL CHECK (start_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
  end_date DATE CHECK (end_date BETWEEN start_date AND DATE '9999-12-31'),
  location TEXT NOT NULL CHECK (char_length(btrim(location)) BETWEEN 1 AND 200),
  source_label TEXT NOT NULL CHECK (char_length(btrim(source_label)) BETWEEN 1 AND 120),
  source_url TEXT NOT NULL CHECK (
    char_length(source_url) <= 2048 AND source_url ~ '^https://[^[:space:]/?#]+[^[:space:]]*$'
  ),
  map_url TEXT CHECK (
    char_length(map_url) <= 2048 AND map_url ~ '^https://[^[:space:]/?#]+[^[:space:]]*$'
  ),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX weekend_events_published_start_idx
  ON public.weekend_events (start_date)
  WHERE is_published;

CREATE TRIGGER touch_weekend_event
  BEFORE UPDATE ON public.weekend_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.weekend_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.weekend_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.weekend_events TO anon, authenticated;
GRANT INSERT (
  slug, title, description, start_date, end_date, location, source_label, source_url, map_url, is_published
) ON public.weekend_events TO authenticated;
GRANT UPDATE (
  slug, title, description, start_date, end_date, location, source_label, source_url, map_url, is_published
) ON public.weekend_events TO authenticated;

CREATE POLICY weekend_events_read_published
  ON public.weekend_events FOR SELECT TO anon, authenticated
  USING (is_published);

CREATE POLICY weekend_events_admin_read
  ON public.weekend_events FOR SELECT TO authenticated
  USING ((SELECT public.is_admin_user(auth.uid()::TEXT)));

CREATE POLICY weekend_events_admin_write
  ON public.weekend_events FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin_user(auth.uid()::TEXT)));

CREATE POLICY weekend_events_admin_update
  ON public.weekend_events FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin_user(auth.uid()::TEXT)))
  WITH CHECK ((SELECT public.is_admin_user(auth.uid()::TEXT)));

INSERT INTO public.weekend_events (
  slug, title, description, start_date, end_date, location, source_label, source_url, map_url, is_published
)
SELECT slug, title, description, start_date, end_date, location, source_label, source_url, map_url, true
FROM (VALUES
  (
    'european-union-film-festival-closing-2026',
    'European Union Film Festival closing screening',
    'The published program closes with a screening at the National Theatre. Check the festival schedule for entry details.',
    DATE '2026-11-21', NULL::DATE,
    'Ethiopian National Theatre',
    'EU Delegation to Ethiopia festival schedule',
    'https://www.eeas.europa.eu/delegations/ethiopia/european-union-film-festival-2026_en',
    'https://www.google.com/maps/search/?api=1&query=Ethiopian%20National%20Theatre%2C%20Addis%20Ababa%2C%20Ethiopia'
  ),
  (
    'great-ethiopian-run-childrens-races-2026',
    'Great Ethiopian Run Children’s Races',
    'The children’s races open the Great Ethiopian Run weekend. Check the race organizer for registration and age groups.',
    DATE '2026-11-21', NULL::DATE,
    'Ethiopian Sports Academy',
    'Great Ethiopian Run’s children’s race announcement',
    'https://capitalethiopia.com/wp-content/uploads/2026/11/Capital_Nov_01_-Iss-1456_2026.pdf#page=24',
    'https://www.google.com/maps/search/?api=1&query=Ethiopian%20Sports%20Academy%2C%20Addis%20Ababa%2C%20Ethiopia'
  ),
  (
    'great-ethiopian-run-10k-2026',
    'Great Ethiopian Run 10km',
    'The city’s road race returns on Sunday. The organizer has the course details and information for participants.',
    DATE '2026-11-22', NULL::DATE,
    'Addis Ababa',
    'Great Ethiopian Run official event site',
    'https://www.greatethiopianrun10k.com/',
    NULL
  ),
  (
    'linkup-bazaar-family-fest-2026-11',
    'LinkUp Bazaar and Family Fest',
    'Browse local makers and enjoy family activities at K-Park.',
    DATE '2026-11-28', DATE '2026-11-29',
    'K-Park, Ethio-Korea Veterans Memorial Park',
    'LinkUp Addis event announcement',
    'https://t.me/LinkUpAddis/13385',
    'https://www.google.com/maps/search/?api=1&query=Ethio-Korea%20Veterans%20Memorial%20Park%2C%20Addis%20Ababa%2C%20Ethiopia'
  )
) AS seed(slug, title, description, start_date, end_date, location, source_label, source_url, map_url)
WHERE COALESCE(end_date, start_date) >= (now() AT TIME ZONE 'Africa/Addis_Ababa')::DATE;

COMMIT;
