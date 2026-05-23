import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorite_destinations';

/**
 * Get all favorite destination IDs
 */
export const getFavorites = async () => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    if (favoritesJson) {
      return JSON.parse(favoritesJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Check if a destination is favorited
 */
export const isFavorited = async (destinationId) => {
  try {
    const favorites = await getFavorites();
    return favorites.includes(destinationId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

/**
 * Add a destination to favorites
 */
export const addFavorite = async (destinationId) => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(destinationId)) {
      const updatedFavorites = [...favorites, destinationId];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
};

/**
 * Remove a destination from favorites
 */
export const removeFavorite = async (destinationId) => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(id => id !== destinationId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

/**
 * Toggle favorite status for a destination
 */
export const toggleFavorite = async (destinationId) => {
  try {
    const isCurrentlyFavorited = await isFavorited(destinationId);
    if (isCurrentlyFavorited) {
      await removeFavorite(destinationId);
      return false;
    } else {
      await addFavorite(destinationId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};
