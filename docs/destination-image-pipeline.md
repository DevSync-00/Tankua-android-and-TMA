# Destination image pipeline

This pipeline discovers, verifies, optimizes, attributes, and uploads destination-specific images. It never assigns generic category fallbacks. A match below `0.85` is stored for review and does not change `destinations.images`.

## Setup

1. Apply [`database/52_destination_image_pipeline.sql`](../database/52_destination_image_pipeline.sql) in Supabase.
2. Confirm the public `destinations` Storage bucket exists.
3. Create a virtual environment and install dependencies:

   ```powershell
   py -m venv .venv-images
   .\.venv-images\Scripts\Activate.ps1
   pip install -r requirements-destination-images.txt
   ```

4. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the root `.env`. Keep the service key server-side. Optional provider keys enable Google Places, Flickr, and Unsplash.

## Safe rollout

Start with a dry run and a small batch:

```powershell
python scripts/acquire_destination_images.py --dry-run --limit 10
```

Then run a real pilot:

```powershell
python scripts/acquire_destination_images.py --limit 25
```

Process a specific batch without revisiting earlier rows:

```powershell
python scripts/acquire_destination_images.py --offset 100 --limit 25
```

Run the full set after reviewing `destination_image_candidates`:

```powershell
python scripts/acquire_destination_images.py
```

The SQLite checkpoint at `.cache/destination_image_pipeline.sqlite3` makes runs resumable. Completed destinations are skipped. Use `--force` only when intentionally re-evaluating them. The summary is written to `database/destination_image_pipeline_report.csv`.

## Matching and review

Providers run in this order: Wikimedia Commons, Wikidata P18, Wikipedia, Google Places when configured, OpenStreetMap/Wikidata, Flickr CC, then Unsplash. Candidates are scored using name/alias overlap, geographic proximity, category evidence, and source reliability. Maps, logos, drawings, undersized files, distant coordinates, weak names, and unusable licenses are rejected explicitly.

Candidates from `0.45` through `0.8499` remain `pending` in `destination_image_candidates`. Reviewers should inspect the image, source page, attribution, license, score breakdown, and rejection reasons before setting the row to `approved`. Automatic assignments are recorded as approved candidates and active assets.

List pending candidates with clickable preview and source URLs:

```powershell
python scripts/approve_destination_image.py --list
```

After visually confirming both the subject and license, approve exactly one candidate:

```powershell
python scripts/approve_destination_image.py --candidate-id 123
```

Approval downloads the original, checks it against active perceptual hashes, creates all three WebP variants, uploads them, writes the asset metadata, updates `destinations.images`, and marks the candidate approved. It refuses rejected or already-processed rows unless `--force` is supplied.

The pipeline generates `large.webp` (maximum 1200 px), `medium.webp` (720 px), and `small.webp` (360 px). A perceptual hash comparison rejects exact and near-identical images already active in the database or accepted during the current run.

## Repeated operation

Schedule the command daily or weekly. It fetches current Supabase destinations, skips checkpointed items, and processes newly inserted destinations. Delete a destination's checkpoint row locally or use `--force` when its name/location changes. API responses are cached independently with provider-appropriate expiry times.

Google Places imagery is governed by Google's current attribution, display, and caching terms. Confirm that your intended Storage workflow is permitted before enabling that provider. Flickr and Unsplash also require compliance with their API and attribution terms.
