import { getDestinations } from './database';
import { deduplicateDestinations } from '../utils/destinationUtils';

let cachedDestinations = null;
let lastFetchTime = 0;
let activeFetchPromise = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const subscribers = new Set();

/**
 * Pre-indexes all searchable fields into a single lowercased string
 * for sub-millisecond multi-word client search.
 */
export function prepareSearchTokens(dest) {
  return [
    dest.name || '',
    dest.city || '',
    dest.region || '',
    dest.category || '',
    dest.description || '',
    Array.isArray(dest.tags) ? dest.tags.join(' ') : '',
  ].join(' ').toLowerCase();
}

/**
 * Subscribe a component to receive fresh background updates
 */
export function subscribeDestinationUpdates(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function notifySubscribers(freshData) {
  subscribers.forEach((cb) => {
    try {
      cb(freshData);
    } catch (err) {
      console.error('SWR subscriber error:', err);
    }
  });
}

function normalizeAndIndexDestinations(rawRows) {
  const normalized = rawRows.map((dest) => ({
    ...dest,
    description: dest.description || '',
    region: dest.region || '',
    city: dest.city || '',
    images: Array.isArray(dest.images) ? dest.images : [],
    tags: Array.isArray(dest.tags) ? dest.tags : [],
    category: dest.category || 'other',
    rating: Number(dest.rating || 0),
    price: Number(dest.price || 0),
    is_verified: Boolean(dest.is_verified),
    _searchTokens: prepareSearchTokens(dest),
  }));

  return deduplicateDestinations(normalized);
}

/**
 * Fetch fresh data with In-Flight Deduplication
 */
export async function fetchDestinationsFresh() {
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = (async () => {
    try {
      const rawRows = await getDestinations({});
      const processed = normalizeAndIndexDestinations(rawRows);
      cachedDestinations = processed;
      lastFetchTime = Date.now();
      notifySubscribers(processed);
      return processed;
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

/**
 * True Stale-While-Revalidate Fetcher
 */
export async function getDestinationsSWR(options = {}) {
  const { forceRefresh = false } = options;
  const isStale = !cachedDestinations || (Date.now() - lastFetchTime > CACHE_TTL_MS);

  if (cachedDestinations && !forceRefresh) {
    if (isStale) {
      fetchDestinationsFresh().catch((err) =>
        console.log('Notice: Silent SWR revalidation failed:', err?.message || err)
      );
    }
    return { data: cachedDestinations, isStale };
  }

  const freshData = await fetchDestinationsFresh();
  return { data: freshData, isStale: false };
}

export function getInstantCachedDestinations() {
  return cachedDestinations || [];
}
