-- =================================================================
-- 50. UPDATE DESTINATIONS CATEGORY CHECK CONSTRAINT
-- =================================================================

ALTER TABLE public.destinations DROP CONSTRAINT IF EXISTS destinations_category_check;

ALTER TABLE public.destinations ADD CONSTRAINT destinations_category_check 
  CHECK (category = ANY (ARRAY[
    'adventure','cultural','medical','religious','ecotourism','business',
    'wildlife','cruise','rural','sports','shopping','wellness','dark',
    'budget','culinary','luxury','voluntourism','space','accessible',
    'agritourism','photography','ancestry','educational','urban',
    'historical','nature','sacred','monument','park','museum','city','other'
  ]));
