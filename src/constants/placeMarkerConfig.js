/**
 * Central mapping: destination categories & religious place types → map marker visuals.
 * Icons use Ionicons or MaterialCommunityIcons (@expo/vector-icons).
 */

export const ICON_FAMILIES = {
  IONICONS: 'ionicons',
  MATERIAL: 'material',
};

/** Religious & sacred place subtypes (resolved from place_type, tags, name, description) */
export const RELIGIOUS_PLACE_TYPES = {
  mosque: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'mosque',
    color: '#1B5E20',
    label: 'Mosque',
  },
  church: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'church',
    color: '#5D4037',
    label: 'Church',
  },
  cathedral: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'church',
    color: '#4E342E',
    label: 'Cathedral',
  },
  monastery: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'candle',
    color: '#6D4C41',
    label: 'Monastery',
  },
  temple: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'temple-hindu',
    color: '#E65100',
    label: 'Temple',
  },
  synagogue: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'synagogue',
    color: '#1565C0',
    label: 'Synagogue',
  },
  shrine: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'star-four-points',
    color: '#7B1FA2',
    label: 'Shrine',
  },
  pilgrimage: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'footsteps-outline',
    color: '#6A1B9A',
    label: 'Pilgrimage Site',
  },
  religious_site: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'hands-pray',
    color: '#FFB800',
    label: 'Religious Site',
  },
};

/** General destination categories */
export const CATEGORY_MARKER_CONFIG = {
  sacred: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'star',
    color: '#F59E0B',
    label: 'Sacred Site',
    defaultPlaceType: 'religious_site',
  },
  religious: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'hands-pray',
    color: '#FFB800',
    label: 'Religious Heritage',
    defaultPlaceType: 'religious_site',
  },
  historical: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'library',
    color: '#8B4513',
    label: 'Historical',
    defaultPlaceType: null,
  },
  nature: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'leaf',
    color: '#10B981',
    label: 'Nature',
    defaultPlaceType: null,
  },
  adventure: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'bicycle',
    color: '#FF6B6B',
    label: 'Adventure',
    defaultPlaceType: null,
  },
  cultural: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'people',
    color: '#9B59B6',
    label: 'Cultural',
    defaultPlaceType: null,
  },
  cultural_center: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'theater',
    color: '#8E24AA',
    label: 'Cultural Center',
    defaultPlaceType: null,
  },
  monument: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'pillar',
    color: '#34495E',
    label: 'Monument',
    defaultPlaceType: null,
  },
  landmark: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'flag',
    color: '#455A64',
    label: 'Landmark',
    defaultPlaceType: null,
  },
  park: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'leaf',
    color: '#2E7D32',
    label: 'Park',
    defaultPlaceType: null,
  },
  museum: {
    iconFamily: ICON_FAMILIES.MATERIAL,
    icon: 'bank',
    color: '#3498DB',
    label: 'Museum',
    defaultPlaceType: null,
  },
  tourist_attraction: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'camera',
    color: '#0288D1',
    label: 'Tourist Attraction',
    defaultPlaceType: null,
  },
  city: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'business',
    color: '#546E7A',
    label: 'City',
    defaultPlaceType: null,
  },
  hotel: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'bed',
    color: '#5C6BC0',
    label: 'Hotel',
    defaultPlaceType: null,
  },
  restaurant: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'restaurant',
    color: '#E64A19',
    label: 'Restaurant',
    defaultPlaceType: null,
  },
  cafe: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'cafe',
    color: '#795548',
    label: 'Café',
    defaultPlaceType: null,
  },
  shopping: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'cart',
    color: '#EC407A',
    label: 'Shopping',
    defaultPlaceType: null,
  },
  entertainment: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'film',
    color: '#AB47BC',
    label: 'Entertainment',
    defaultPlaceType: null,
  },
  transport: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'train',
    color: '#37474F',
    label: 'Transport',
    defaultPlaceType: null,
  },
  transportation: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'bus',
    color: '#37474F',
    label: 'Transportation',
    defaultPlaceType: null,
  },
  other: {
    iconFamily: ICON_FAMILIES.IONICONS,
    icon: 'location',
    color: '#FFB800',
    label: 'Destination',
    defaultPlaceType: null,
  },
};

export const DEFAULT_MARKER = CATEGORY_MARKER_CONFIG.other;

/** Filter chip list (ionicons for compact UI chips) */
export const DESTINATION_FILTER_CATEGORIES = [
  { id: 'sacred', label: 'Sacred Sites', icon: 'star-outline' },
  { id: 'religious', label: 'Religious Heritage', icon: 'book-outline' },
  { id: 'historical', label: 'Historical', icon: 'library-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'people-outline' },
  { id: 'cultural_center', label: 'Cultural Centers', icon: 'color-palette-outline' },
  { id: 'monument', label: 'Monuments', icon: 'location-outline' },
  { id: 'landmark', label: 'Landmarks', icon: 'flag-outline' },
  { id: 'park', label: 'Parks', icon: 'leaf-outline' },
  { id: 'museum', label: 'Museums', icon: 'library-outline' },
  { id: 'tourist_attraction', label: 'Attractions', icon: 'camera-outline' },
  { id: 'city', label: 'City Life', icon: 'business-outline' },
  { id: 'hotel', label: 'Hotels', icon: 'bed-outline' },
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant-outline' },
  { id: 'cafe', label: 'Cafés', icon: 'cafe-outline' },
  { id: 'shopping', label: 'Shopping', icon: 'cart-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { id: 'transport', label: 'Transport', icon: 'train-outline' },
];

export const MAP_SCREEN_CATEGORIES = [
  { id: null, label: 'All', icon: 'apps-outline' },
  ...DESTINATION_FILTER_CATEGORIES,
];

export const getMarkerColor = (category) =>
  CATEGORY_MARKER_CONFIG[category]?.color || DEFAULT_MARKER.color;

export const getCategoryIconName = (categoryId) => {
  const match = DESTINATION_FILTER_CATEGORIES.find((c) => c.id === categoryId);
  return match?.icon || 'location-outline';
};
