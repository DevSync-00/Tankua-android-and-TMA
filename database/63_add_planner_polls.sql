BEGIN;

CREATE TABLE public.planner_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp()
);

CREATE TABLE public.planner_poll_outings (
  poll_id UUID NOT NULL REFERENCES public.planner_polls (id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (length(slug) <= 96 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
  PRIMARY KEY (poll_id, slug),
  UNIQUE (poll_id, position)
);

CREATE TABLE public.planner_poll_dates (
  poll_id UUID NOT NULL REFERENCES public.planner_polls (id) ON DELETE CASCADE,
  outing_date DATE NOT NULL,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
  PRIMARY KEY (poll_id, outing_date),
  UNIQUE (poll_id, position)
);

CREATE TABLE public.planner_poll_votes (
  poll_id UUID NOT NULL,
  voter_hash TEXT NOT NULL CHECK (voter_hash ~ '^[a-f0-9]{64}$'),
  outing_slug TEXT NOT NULL,
  outing_date DATE NOT NULL,
  PRIMARY KEY (poll_id, voter_hash),
  FOREIGN KEY (poll_id, outing_slug) REFERENCES public.planner_poll_outings (poll_id, slug) ON DELETE CASCADE,
  FOREIGN KEY (poll_id, outing_date) REFERENCES public.planner_poll_dates (poll_id, outing_date) ON DELETE CASCADE
);

CREATE INDEX planner_poll_votes_outing_idx ON public.planner_poll_votes (poll_id, outing_slug);
CREATE INDEX planner_poll_votes_date_idx ON public.planner_poll_votes (poll_id, outing_date);

ALTER TABLE public.planner_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_poll_outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_poll_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_poll_votes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  public.planner_polls, public.planner_poll_outings, public.planner_poll_dates, public.planner_poll_votes
FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.read_planner_poll(p_poll_id UUID, p_voter_hash TEXT)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', poll.id,
    'outings', (
      SELECT jsonb_agg(jsonb_build_object(
        'slug', outing.slug,
        'votes', (
          SELECT count(*)
          FROM public.planner_poll_votes AS vote
          WHERE vote.poll_id = poll.id AND vote.outing_slug = outing.slug
        )
      ) ORDER BY outing.position)
      FROM public.planner_poll_outings AS outing
      WHERE outing.poll_id = poll.id
    ),
    'dates', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', picked_date.outing_date,
        'votes', (
          SELECT count(*)
          FROM public.planner_poll_votes AS vote
          WHERE vote.poll_id = poll.id AND vote.outing_date = picked_date.outing_date
        )
      ) ORDER BY picked_date.position)
      FROM public.planner_poll_dates AS picked_date
      WHERE picked_date.poll_id = poll.id
    ),
    'voteCount', (
      SELECT count(*) FROM public.planner_poll_votes AS vote WHERE vote.poll_id = poll.id
    ),
    'myVote', (
      SELECT jsonb_build_object('outingSlug', vote.outing_slug, 'date', vote.outing_date)
      FROM public.planner_poll_votes AS vote
      WHERE vote.poll_id = poll.id AND vote.voter_hash = p_voter_hash
    )
  )
  FROM public.planner_polls AS poll
  WHERE poll.id = p_poll_id;
$$;

CREATE FUNCTION public.create_planner_poll(p_outing_slugs TEXT[], p_dates DATE[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id UUID;
  today DATE := timezone('Africa/Addis_Ababa', statement_timestamp())::date;
BEGIN
  IF COALESCE(cardinality(p_outing_slugs), 0) NOT BETWEEN 2 AND 3
    OR (SELECT count(DISTINCT slug) FROM unnest(p_outing_slugs) AS option(slug)) <> cardinality(p_outing_slugs)
    OR EXISTS (
      SELECT 1 FROM unnest(p_outing_slugs) AS option(slug)
      WHERE length(option.slug) > 96 OR option.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  THEN
    RAISE EXCEPTION 'Choose two or three different outings.' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(cardinality(p_dates), 0) NOT BETWEEN 2 AND 3
    OR (SELECT count(DISTINCT proposed_date) FROM unnest(p_dates) AS option(proposed_date)) <> cardinality(p_dates)
    OR EXISTS (
      SELECT 1 FROM unnest(p_dates) AS option(proposed_date)
      WHERE NOT isfinite(option.proposed_date) OR option.proposed_date < today
    )
  THEN
    RAISE EXCEPTION 'Choose two or three different dates from today onward.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.planner_polls DEFAULT VALUES RETURNING id INTO new_id;
  INSERT INTO public.planner_poll_outings (poll_id, slug, position)
    SELECT new_id, option.slug, option.position::smallint
    FROM unnest(p_outing_slugs) WITH ORDINALITY AS option(slug, position);
  INSERT INTO public.planner_poll_dates (poll_id, outing_date, position)
    SELECT new_id, option.proposed_date, option.position::smallint
    FROM unnest(p_dates) WITH ORDINALITY AS option(proposed_date, position);

  RETURN public.read_planner_poll(new_id, NULL);
END;
$$;

CREATE FUNCTION public.vote_planner_poll(
  p_poll_id UUID, p_voter_hash TEXT, p_outing_slug TEXT, p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  today DATE := timezone('Africa/Addis_Ababa', statement_timestamp())::date;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.planner_polls WHERE id = p_poll_id) THEN
    RETURN NULL;
  END IF;

  IF p_voter_hash IS NULL OR p_voter_hash !~ '^[a-f0-9]{64}$'
    OR NOT EXISTS (
      SELECT 1 FROM public.planner_poll_outings WHERE poll_id = p_poll_id AND slug = p_outing_slug
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.planner_poll_dates WHERE poll_id = p_poll_id AND outing_date = p_date
    )
  THEN
    RAISE EXCEPTION 'Choose an outing and a date from this poll.' USING ERRCODE = '22023';
  END IF;

  IF p_date < today THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.planner_poll_dates WHERE poll_id = p_poll_id AND outing_date >= today
    ) THEN
      RAISE EXCEPTION 'This poll has closed because all its dates have passed.' USING ERRCODE = 'PT409';
    END IF;

    RAISE EXCEPTION 'This date has passed. Choose another date.' USING ERRCODE = 'PT409';
  END IF;

  INSERT INTO public.planner_poll_votes (poll_id, voter_hash, outing_slug, outing_date)
  VALUES (p_poll_id, p_voter_hash, p_outing_slug, p_date)
  ON CONFLICT (poll_id, voter_hash) DO UPDATE
    SET outing_slug = EXCLUDED.outing_slug, outing_date = EXCLUDED.outing_date;

  RETURN public.read_planner_poll(p_poll_id, p_voter_hash);
END;
$$;

REVOKE ALL ON FUNCTION public.read_planner_poll(UUID, TEXT),
  public.create_planner_poll(TEXT[], DATE[]), public.vote_planner_poll(UUID, TEXT, TEXT, DATE)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.read_planner_poll(UUID, TEXT),
  public.create_planner_poll(TEXT[], DATE[]), public.vote_planner_poll(UUID, TEXT, TEXT, DATE)
TO service_role;

COMMIT;
