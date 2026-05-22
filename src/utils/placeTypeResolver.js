import {
  RELIGIOUS_PLACE_TYPES,
  CATEGORY_MARKER_CONFIG,
  DEFAULT_MARKER,
} from '../constants/placeMarkerConfig';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '_');

/** Keyword → religious place type (order matters: more specific first) */
const RELIGIOUS_KEYWORD_RULES = [
  { type: 'mosque', keywords: ['mosque', 'masjid', 'masgid', 'mesgid', 'islamic', 'muslim', 'መስጊድ', 'mesjid', 'jamia', 'jami'] },
  { type: 'cathedral', keywords: ['cathedral', 'basilica', 'st_peters'] },
  { type: 'monastery', keywords: ['monastery', 'monastic', 'convent', 'ደብረ', 'debre', 'debre_', 'abune'] },
  { type: 'church', keywords: ['church', 'orthodox', 'christian', 'coptic', 'protestant', 'catholic', 'chapel', 'ቤተክርስቲያን', 'bete_kristian', 'betekristian', 'ekklesia'] },
  { type: 'synagogue', keywords: ['synagogue', 'jewish', 'judaism'] },
  { type: 'temple', keywords: ['temple', 'hindu', 'buddhist', 'buddha', 'pagoda'] },
  { type: 'shrine', keywords: ['shrine', 'mausoleum', 'tomb_of', 'holy_site'] },
  { type: 'pilgrimage', keywords: ['pilgrimage', 'pilgrim', 'hajj', 'umrah'] },
];

const CATEGORY_ALIASES = {
  church: 'religious',
  churches: 'religious',
  mosque: 'religious',
  mosques: 'religious',
  attraction: 'tourist_attraction',
  attractions: 'tourist_attraction',
  tourist: 'tourist_attraction',
  food: 'restaurant',
  dining: 'restaurant',
  coffee: 'cafe',
  transport_hub: 'transport',
  transportation_hub: 'transport',
  airport: 'transport',
  station: 'transport',
};

const matchesKeywords = (text, keywords) => {
  if (!text) return false;
  const normalized = normalize(text);
  return keywords.some((kw) => normalized.includes(normalize(kw)));
};

const inferReligiousPlaceType = (destination) => {
  const tags = Array.isArray(destination?.tags) ? destination.tags : [];
  const tagText = tags.join(' ');
  const combined = [destination?.name, destination?.description, tagText]
    .filter(Boolean)
    .join(' ');

  for (const { type, keywords } of RELIGIOUS_KEYWORD_RULES) {
    if (matchesKeywords(combined, keywords)) {
      return type;
    }
  }

  return null;
};

/**
 * Resolve explicit place_type from API/DB (place_type, place_subtype, religious_type, type).
 */
export const resolveExplicitPlaceType = (destination) => {
  const raw =
    destination?.place_type ||
    destination?.place_subtype ||
    destination?.religious_type ||
    destination?.subtype ||
    null;

  if (!raw) return null;

  const key = normalize(raw);
  if (RELIGIOUS_PLACE_TYPES[key]) return key;

  const aliasMap = {
    masjid: 'mosque',
    masgid: 'mosque',
    orthodox_church: 'church',
    christian_church: 'church',
    holy_site: 'shrine',
    religious: 'religious_site',
  };

  return aliasMap[key] || (CATEGORY_MARKER_CONFIG[key] ? key : null);
};

/** Google Places items already include a mapped Tankua category. */
const resolveCategoryFromGoogle = (destination) => {
  if (destination?.source === 'google' && destination.category) {
    return destination.category;
  }
  return null;
};

/**
 * Full marker config for a destination (category + religious subtype + fallbacks).
 */
export const resolvePlaceMarker = (destination) => {
  const category =
    resolveCategoryFromGoogle(destination) ||
    CATEGORY_ALIASES[normalize(destination?.category)] ||
    normalize(destination?.category) ||
    'other';

  let placeType = resolveExplicitPlaceType(destination);

  const isReligiousCategory = ['religious', 'sacred', 'church'].includes(category);
  if (!placeType && isReligiousCategory) {
    placeType = inferReligiousPlaceType(destination) || 'religious_site';
  }

  if (!placeType && category === 'church') {
    placeType = inferReligiousPlaceType(destination) || 'church';
  }

  if (placeType && RELIGIOUS_PLACE_TYPES[placeType]) {
    const religious = RELIGIOUS_PLACE_TYPES[placeType];
    const categoryConfig = CATEGORY_MARKER_CONFIG[category] || DEFAULT_MARKER;
    return {
      placeType,
      category,
      iconFamily: religious.iconFamily,
      icon: religious.icon,
      color: religious.color,
      label: religious.label,
      chipIcon: categoryConfig.iconFamily === religious.iconFamily
        ? religious.icon
        : (CATEGORY_MARKER_CONFIG[category]?.icon || DEFAULT_MARKER.icon),
    };
  }

  const categoryConfig = CATEGORY_MARKER_CONFIG[category] || DEFAULT_MARKER;
  return {
    placeType: placeType || categoryConfig.defaultPlaceType || null,
    category,
    iconFamily: categoryConfig.iconFamily,
    icon: categoryConfig.icon,
    color: categoryConfig.color,
    label: categoryConfig.label,
    chipIcon: categoryConfig.icon,
  };
};

export const getPlaceTypeLabel = (destination) => resolvePlaceMarker(destination).label;
