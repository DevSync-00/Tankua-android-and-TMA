/** Destination categories — aligned with DB enum. */
export const DESTINATION_CATEGORIES = [
  { id: 'sacred', label: 'Sacred Sites', icon: 'star-outline' },
  { id: 'religious', label: 'Religious Heritage', icon: 'book-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'city', label: 'City Life', icon: 'business-outline' },
  { id: 'historical', label: 'Historical', icon: 'library-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'bicycle-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'people-outline' },
];

export const MAP_CATEGORY_FILTERS = DESTINATION_CATEGORIES.map(({ id, label, icon }) => ({
  id,
  label,
  icon,
}));
