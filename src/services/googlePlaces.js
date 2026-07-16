import { GOOGLE_MAPS_API_KEY, isGoogleMapsConfigured } from '../config/googleMaps';
import {
  normalizeGooglePlace,
  FILTER_TO_GOOGLE_TYPES,
  DEFAULT_NEARBY_TYPES,
  sanitizeNearbyTypes,
  buildGooglePhotoUrl,
} from '../utils/googlePlaceMapper';
import { ensureDestinationImages } from './database';

const PLACES_BASE = 'https://places.googleapis.com/v1';

const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.iconMaskBaseUri',
  'places.iconBackgroundColor',
  'places.photos',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'iconMaskBaseUri',
  'iconBackgroundColor',
  'photos',
  'regularOpeningHours',
  'websiteUri',
].join(',');

const regionToRadiusMeters = (latitudeDelta = 0.05) => {
  const meters = (latitudeDelta * 111000) / 2;
  return Math.min(50000, Math.max(500, Math.round(meters)));
};

async function placesRequest(path, body, fieldMask) {
  if (!isGoogleMapsConfigured()) {
    throw new Error('Google Maps API key is not configured. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env');
  }

  const response = await fetch(`${PLACES_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Places API error (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Nearby search using visible map region (Google Places API New).
 */
export async function searchNearbyPlaces({
  latitude,
  longitude,
  latitudeDelta = 0.08,
  categoryFilter = null,
  maxResultCount = 20,
}) {
  const radius = regionToRadiusMeters(latitudeDelta);
  const rawTypes = categoryFilter
    ? FILTER_TO_GOOGLE_TYPES[categoryFilter]
    : DEFAULT_NEARBY_TYPES;
  const includedPrimaryTypes = sanitizeNearbyTypes(rawTypes);

  const body = {
    maxResultCount: Math.min(maxResultCount, 20),
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
  };

  if (includedPrimaryTypes.length > 0) {
    body.includedPrimaryTypes = includedPrimaryTypes;
  }

  const data = await placesRequest('/places:searchNearby', body, NEARBY_FIELD_MASK);
  const places = (data.places || []).map(normalizeGooglePlace).map(ensureDestinationImages);

  return dedupePlaces(places);
}

/**
 * Text search (user query).
 */
export async function searchPlacesByText({
  query,
  latitude,
  longitude,
  categoryFilter = null,
  maxResultCount = 20,
}) {
  if (!query?.trim()) return [];

  const body = {
    textQuery: query.trim(),
    maxResultCount: Math.min(maxResultCount, 20),
    rankPreference: 'RELEVANCE',
  };

  if (latitude != null && longitude != null) {
    body.locationBias = {
      circle: {
        center: { latitude, longitude },
        radius: 30000,
      },
    };
  }

  const rawTypes = categoryFilter
    ? FILTER_TO_GOOGLE_TYPES[categoryFilter]
    : DEFAULT_NEARBY_TYPES;
  const sanitized = sanitizeNearbyTypes(rawTypes);
  if (sanitized.length > 0) {
    body.includedType = sanitized[0];
  }

  const data = await placesRequest('/places:searchText', body, NEARBY_FIELD_MASK);
  const places = (data.places || []).map(normalizeGooglePlace).map(ensureDestinationImages);
  return dedupePlaces(places);
}

/**
 * Place details for selected marker card (photos, hours, website).
 */
export async function fetchPlaceDetails(placeId) {
  const id = placeId?.startsWith('places/') ? placeId : `places/${placeId}`;
  const response = await fetch(`${PLACES_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to load place details');
  }

  const normalized = normalizeGooglePlace(data);
  if (normalized.photoName) {
    const photoUrl = buildGooglePhotoUrl(normalized.photoName, GOOGLE_MAPS_API_KEY);
    if (photoUrl) normalized.images = [photoUrl];
  }
  return ensureDestinationImages(normalized);
}

function dedupePlaces(places) {
  const seen = new Set();
  return places.filter((p) => {
    if (!p.id || seen.has(p.id) || !p.lat || !p.lng) return false;
    seen.add(p.id);
    return true;
  });
}

export { isGoogleMapsConfigured, regionToRadiusMeters };
