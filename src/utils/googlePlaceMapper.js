/**
 * Maps Google Places types → Tankua category filters & marker fallbacks.
 */

const GOOGLE_TYPE_PRIORITY = [
  'mosque',
  'church',
  'hindu_temple',
  'synagogue',
  'place_of_worship',
  'museum',
  'park',
  'national_park',
  'tourist_attraction',
  'historical_landmark',
  'monument',
  'art_gallery',
  'cultural_center',
  'performing_arts_theater',
  'lodging',
  'hotel',
  'restaurant',
  'cafe',
  'shopping_mall',
  'store',
  'movie_theater',
  'amusement_park',
  'airport',
  'train_station',
  'bus_station',
  'transit_station',
  'natural_feature',
  'point_of_interest',
];

const TYPE_TO_CATEGORY = {
  mosque: 'religious',
  church: 'religious',
  hindu_temple: 'religious',
  synagogue: 'religious',
  buddhist_temple: 'religious',
  shinto_shrine: 'religious',
  place_of_worship: 'religious',
  museum: 'museum',
  art_gallery: 'museum',
  park: 'park',
  national_park: 'park',
  natural_feature: 'nature',
  nature_preserve: 'nature',
  beach: 'nature',
  scenic_spot: 'nature',
  historical_place: 'historical',
  tourist_attraction: 'tourist_attraction',
  historical_landmark: 'historical',
  monument: 'monument',
  cultural_center: 'cultural_center',
  performing_arts_theater: 'cultural',
  lodging: 'hotel',
  hotel: 'hotel',
  restaurant: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'cafe',
  shopping_mall: 'shopping',
  store: 'shopping',
  movie_theater: 'entertainment',
  amusement_park: 'entertainment',
  airport: 'transport',
  train_station: 'transport',
  bus_station: 'transport',
  transit_station: 'transport',
};

/**
 * Table A types only — Table B types (e.g. place_of_worship, point_of_interest)
 * cannot be used in Nearby/Text search requests.
 */
export const TABLE_A_NEARBY_TYPES = new Set([
  'church', 'mosque', 'hindu_temple', 'synagogue', 'buddhist_temple', 'shinto_shrine',
  'museum', 'art_gallery', 'history_museum',
  'park', 'national_park', 'nature_preserve', 'beach', 'scenic_spot', 'botanical_garden',
  'tourist_attraction', 'visitor_center', 'historical_landmark', 'historical_place',
  'monument', 'cultural_center', 'performing_arts_theater', 'cultural_landmark',
  'restaurant', 'cafe', 'coffee_shop',
  'hotel', 'lodging',
  'shopping_mall', 'store',
  'movie_theater', 'amusement_park',
  'airport', 'train_station', 'bus_station', 'transit_station', 'subway_station',
  'plaza', 'zoo', 'aquarium',
]);

/** Default types when browsing all categories */
export const DEFAULT_NEARBY_TYPES = [
  'tourist_attraction',
  'museum',
  'park',
  'church',
  'mosque',
];

/** Map filter chip id → Google Places Table A types for searchNearby */
export const FILTER_TO_GOOGLE_TYPES = {
  sacred: ['church', 'mosque', 'hindu_temple', 'synagogue'],
  religious: ['church', 'mosque', 'hindu_temple', 'synagogue', 'buddhist_temple'],
  historical: ['historical_landmark', 'historical_place', 'museum'],
  nature: ['park', 'national_park', 'nature_preserve', 'beach'],
  adventure: ['tourist_attraction', 'amusement_park', 'hiking_area'],
  cultural: ['cultural_center', 'performing_arts_theater', 'art_gallery'],
  cultural_center: ['cultural_center'],
  monument: ['monument', 'historical_landmark'],
  landmark: ['tourist_attraction', 'historical_landmark', 'cultural_landmark'],
  park: ['park', 'national_park', 'botanical_garden'],
  museum: ['museum', 'art_gallery', 'history_museum'],
  tourist_attraction: ['tourist_attraction', 'visitor_center'],
  city: ['tourist_attraction', 'plaza', 'visitor_center'],
  hotel: ['hotel', 'lodging'],
  restaurant: ['restaurant'],
  cafe: ['cafe', 'coffee_shop'],
  shopping: ['shopping_mall', 'store'],
  entertainment: ['movie_theater', 'amusement_park'],
  transport: ['airport', 'train_station', 'bus_station', 'transit_station'],
};

/** Strip unsupported Table B types before API requests (max 5 per request). */
export const sanitizeNearbyTypes = (types = []) => {
  const valid = types.filter((t) => TABLE_A_NEARBY_TYPES.has(t));
  return [...new Set(valid)].slice(0, 5);
};

export const getPrimaryGoogleType = (types = [], primaryType = null) => {
  if (primaryType) return primaryType;
  if (!types?.length) return null;
  for (const t of GOOGLE_TYPE_PRIORITY) {
    if (types.includes(t)) return t;
  }
  return types[0];
};

export const mapGoogleTypesToCategory = (types = [], primaryType = null) => {
  const primary = getPrimaryGoogleType(types, primaryType);
  if (primary && TYPE_TO_CATEGORY[primary]) {
    return TYPE_TO_CATEGORY[primary];
  }
  for (const t of GOOGLE_TYPE_PRIORITY) {
    if (types.includes(t) && TYPE_TO_CATEGORY[t]) {
      return TYPE_TO_CATEGORY[t];
    }
  }
  return 'tourist_attraction';
};

const extractCity = (formattedAddress = '') => {
  const parts = formattedAddress.split(',').map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || '';
};

/**
 * Normalize Places API (New) place resource for the map UI.
 */
export const normalizeGooglePlace = (place) => {
  const types = place.types || [];
  const primaryType = place.primaryType || null;
  const category = mapGoogleTypesToCategory(types, primaryType);

  return {
    id: place.id,
    googlePlaceId: place.id,
    name: place.displayName?.text || place.displayName || 'Unknown place',
    description: place.formattedAddress || place.shortFormattedAddress || '',
    city: extractCity(place.formattedAddress || ''),
    region: '',
    category,
    place_type: getPrimaryGoogleType(types, primaryType),
    types,
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? 0,
    iconMaskBaseUri: place.iconMaskBaseUri || null,
    iconBackgroundColor: place.iconBackgroundColor || '#7B9EB0',
    googleMapsUri: place.googleMapsUri || null,
    images: [],
    photoName: place.photos?.[0]?.name || null,
    tags: types,
    source: 'google',
    fullData: place,
    distance: null,
  };
};

export const buildGooglePhotoUrl = (photoName, apiKey, maxWidth = 400) => {
  if (!photoName || !apiKey) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
};

export const getGoogleIconUrl = (iconMaskBaseUri, scale = 2) => {
  if (!iconMaskBaseUri) return null;
  const base = iconMaskBaseUri.endsWith('/') ? iconMaskBaseUri.slice(0, -1) : iconMaskBaseUri;
  return `${base}_${scale}.png`;
};
