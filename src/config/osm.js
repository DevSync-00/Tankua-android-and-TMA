/**
 * OpenStreetMap (OSM) & CartoDB Tile Configuration
 * Fully open-source mapping stack with zero API keys or billing constraints.
 */

// CartoDB Voyager No-Labels High-DPI Retina Tile Server
// Purges background commercial POIs (cafes, shops, schools) so platform destinations stand out.
export const OSM_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png';

// Clean CartoDB Positron No-Labels Tile Server (Ultra-minimal alternative)
export const OSM_POSITRON_NO_LABELS = 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png';

// Standard Voyager Tile Server (Includes background labels)
export const OSM_TILE_URL_WITH_LABELS = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';

// Fallback OpenStreetMap Standard Tile Server
export const OSM_FALLBACK_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Tile Attribution Requirement
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors, © CARTO';

// OpenStreetMap Web Directions URL (fossgis OSRM engine)
export const getOsmDirectionsUrl = (originLat, originLng, destLat, destLng) => {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${destLat}%2C${destLng}`;
};

// OpenStreetMap Search Query URL
export const getOsmSearchUrl = (query) => {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.openstreetmap.org/search?query=${encodedQuery}`;
};

/**
 * Fetches turn-by-turn road route coordinates using free OSRM (Open Source Routing Machine) API.
 * Returns array of { latitude, longitude } for map <Polyline />, plus distance & duration.
 */
export const fetchOsmRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
      return {
        coordinates,
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
};
