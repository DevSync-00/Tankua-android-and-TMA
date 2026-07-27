/**
 * DEPRECATED: Google Maps API has been migrated to OpenStreetMap (OSM).
 * Please import tile configuration from src/config/osm.js instead.
 */
import { OSM_TILE_URL, OSM_ATTRIBUTION, getOsmDirectionsUrl, getOsmSearchUrl } from './osm';

export const GOOGLE_MAPS_API_KEY = '';
export const isGoogleMapsConfigured = () => false;
export const GOOGLE_MAPS_STYLE = [];

export { OSM_TILE_URL, OSM_ATTRIBUTION, getOsmDirectionsUrl, getOsmSearchUrl };
