# Map Engine & Backend Optimization Implementation Plan (Revised)

This implementation plan details the step-by-step enhancements for the Tankua Map System (excluding public OSRM fallback server changes per user directive). It resolves marker flickering, implements battery-safe live GPS tracking with subscription cleanup, adds a prop-driven floating recenter FAB, enables native external map navigation with web fallbacks, provides complete PostGIS migration SQL, and clarifies data reconciliation.

## User Review Required

> [!IMPORTANT]
> - **PostGIS Migration SQL**: Includes a 5-step SQL migration script for Supabase to enable PostGIS, add `location_point` geography column, backfill data, create a GIST index, and deploy `get_destinations_in_bbox`.
> - **Data Source Reconciliation**: `MapScreen.js` retains `destinationCache.js` (`getDestinationsSWR`) as its primary data source for 0ms instant tab rendering and offline support, while applying viewport bounds filtering in memory.
> - **Live GPS Tracking Cleanup**: `Location.watchPositionAsync` subscription object will be stored and cleaned up via `.remove()` in `useEffect` on unmount.
> - **Recenter FAB Mechanism**: Recenter FAB triggers `setRegion` state, which passes updated coordinates to `OsmMapView` and invokes Leaflet `map.flyTo(...)` via WebView JavaScript injection.
> - **GPS Heading Cone**: User location marker uses `location.coords.heading` from `watchPositionAsync` to rotate the heading cone arrow during movement.
> - **External Maps Fallback**: Native map launching checks `Linking.canOpenURL()` and falls back to `https://www.google.com/maps/dir/...` web URL if Google/Apple Maps app is not installed.

## Proposed Changes

---

### Backend & Database Layer

#### [NEW] [20260822030000_enable_postgis_and_spatial_bbox.sql](file:///c:/Tankua2.0/Tankua-android/supabase/migrations/20260822030000_enable_postgis_and_spatial_bbox.sql)

Create database migration with the following steps:
1. `CREATE EXTENSION IF NOT EXISTS postgis;`
2. `ALTER TABLE destinations ADD COLUMN IF NOT EXISTS location_point geography(Point, 4326);`
3. Backfill `location_point`:
   ```sql
   UPDATE destinations
   SET location_point = ST_SetSRID(ST_MakePoint((location->>'lng')::float, (location->>'lat')::float), 4326)::geography
   WHERE location IS NOT NULL AND location->>'lat' IS NOT NULL AND location->>'lng' IS NOT NULL;
   ```
4. `CREATE INDEX IF NOT EXISTS idx_destinations_location_point ON destinations USING gist(location_point);`
5. Create RPC function `get_destinations_in_bbox(min_lat float, max_lat float, min_lng float, max_lng float, p_category text)`.

#### [MODIFY] [database.js](file:///c:/Tankua2.0/Tankua-android/src/services/database.js)

- Add `getDestinationsInBBox(minLat, maxLat, minLng, maxLng, category)` calling `supabase.rpc('get_destinations_in_bbox', ...)`.

---

### Map Component Layer

#### [MODIFY] [OsmMapView.js](file:///c:/Tankua2.0/Tankua-android/src/components/OsmMapView.js)

- **Incremental Marker Diffing (No Flickering)**: Update `updateData()` in Leaflet WebView HTML/JS to toggle CSS class `.selected` on the active marker element instead of executing `markersGroup.clearLayers()` on selection changes.
- **Directional User Marker Cone**: Render a directional heading cone arrow (`.user-heading-cone`) on the user marker element, rotated by `userLocation.heading` (GPS-derived heading angle).
- **Prop-Driven Camera Pan**: When `region` prop updates, trigger Leaflet `map.flyTo([region.latitude, region.longitude], zoom)` smoothly.

---

### Map Screen & Interaction Layer

#### [MODIFY] [MapScreen.js](file:///c:/Tankua2.0/Tankua-android/src/screens/MapScreen.js)

- **Live GPS Tracking & Subscription Cleanup**: Implement `Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 10 })` inside `useEffect`, storing subscription in `locationSubRef.current` and calling `locationSubRef.current.remove()` on unmount.
- **Floating Recenter FAB Button**: Add a floating `<TouchableOpacity>` with a target crosshair icon anchored at the bottom-right. Tapping it calls `setRegion` to user GPS coordinates, driving `OsmMapView` camera flyTo.
- **External Native Maps Launcher with Web Fallback**: Add "Open in Maps" handler that checks `Linking.canOpenURL(nativeUrl)` for `google.navigation:q=` or `maps://app?daddr=`, falling back to Google Maps web directions URL if the app is missing.

---

## Verification Plan

### Execution Standard
All modified files will be written in full and verified for syntax and structural integrity.

### Verification Checklist & Empirical Output Requirements
1. **Flicker-Free Marker Selection Test**: Tap markers in `MapScreen.js` -> Confirm smooth `.selected` CSS class toggle in WebView without marker redraw flicker.
2. **GPS Watch Subscription & Cleanup Test**: Mount `MapScreen` -> Verify `watchPositionAsync` updates `userLocation`; navigate away -> Verify `locationSubRef.current.remove()` is invoked in console logs.
3. **Recenter FAB Camera Test**: Pan map away -> Tap Recenter FAB button -> Confirm `setRegion` triggers Leaflet `flyTo` back to user GPS coords.
4. **External Maps Fallback Test**: Tap external directions button -> Confirm `Linking.canOpenURL()` handles native app launch or falls back cleanly to Google Maps web URL.
