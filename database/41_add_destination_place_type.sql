-- Optional: explicit religious / place subtype for context-aware map icons
-- Values: mosque, church, cathedral, monastery, temple, synagogue, shrine, etc.

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS place_type TEXT;

COMMENT ON COLUMN destinations.place_type IS
  'Subtype for map icons (mosque, church, museum, etc.). Falls back to category + tags when null.';
