# Destination enrichment

`enrich_destinations.py` reads a PostgreSQL destination export, looks up missing
locations with OpenStreetMap Nominatim, and generates UUID-targeted SQL updates.
It never modifies the input SQL or the live database.

Many Tankua rows are experiences rather than literal map entities. The resolver
therefore tries a canonical geographic anchor from the name and tags (for example,
`Jinka Urban Hub` resolves through `Jinka`) and records the successful query in
the review report. Several experience variants may legitimately share the same
parent-place coordinates.

## Location-only run

Use a contact email so the Nominatim operator can reach you if necessary:

```powershell
python scripts/enrich_destinations.py `
  "C:\Users\HP\Downloads\destinations_rows.sql" `
  --email "you@example.com" `
  --output database/destinations_enriched.sql `
  --report database/destinations_enrichment_report.csv
```

Start with `--limit 10` to inspect matching quality. Results are cached in
`.cache/destination_enrichment.json`, so reruns do not repeat completed requests.
Transient request errors are not cached and will be retried. The script requests
English place names and observes Nominatim's one-request-per-second ceiling.
Use `--offset 100 --limit 100` to process source rows 101-200 as an independent
review and SQL batch while reusing the same cache.

Only matches inside Ethiopia are accepted. Low-confidence and unmatched rows are
recorded in the CSV but are not written to SQL. Existing region, city, location,
and images are preserved unless `--force` is supplied. `distance` is deliberately
left unchanged because user-relative distance should be calculated from the saved
latitude and longitude.

Exact POI matches generate SQL automatically. Canonical parent places are labeled
`anchor` and are withheld because a plausible city/area is not proof of the exact
facility or attraction. After reviewing the report, `--accept-anchor` can include
all anchor rows in the generated SQL; for mixed-quality batches, approve individual
rows manually instead of enabling the flag globally.

Pass `--approved-anchor-ids path/to/file.txt` to include only reviewed anchors.
The file accepts one destination UUID per line and `#` comments. This is the
recommended production workflow; `--accept-anchor` is intended only for uniformly
safe datasets.

## Wikimedia image run

Install Pillow:

```powershell
python -m pip install Pillow
```

Then request one freely licensed Commons image per missing destination:

```powershell
python scripts/enrich_destinations.py `
  "C:\Users\HP\Downloads\destinations_rows.sql" `
  --email "you@example.com" `
  --images
```

This downloads a maximum 1200x900 WebP cover at quality 78. Local paths are
recorded in the CSV but are not written into the database. The CSV also includes
the Commons source page and license for review/attribution. Image matching is
best effort, requires destination/title relevance, and must still be reviewed
before publishing.

Image discovery can run alongside geocoding in a second terminal. Use separate
cache, report, and SQL paths so the processes cannot overwrite each other:

```powershell
python scripts/enrich_destinations.py `
  "C:\Users\HP\Downloads\destinations_rows.sql" `
  --images `
  --skip-geocoding `
  --limit 10 `
  --cache .cache/destination_images.json `
  --report database/destination_images_report.csv `
  --output database/destination_images.sql
```

Without `--upload`, downloaded local paths appear only in the review CSV; they
are intentionally not written into SQL.

To upload the converted files to the existing public `destinations` Supabase
Storage bucket, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then add
`--upload`. The service-role key must stay server-side and must never be committed.

## Safety notes

- Review both generated files before applying the SQL.
- Do not use `--force` unless replacing verified data is intentional.
- Nominatim bulk use is subject to its current usage policy. For large or repeated
  imports, use a hosted geocoder or your own Nominatim instance.
- Wikimedia metadata is retained in the report; comply with the listed license
  and attribution requirements.
