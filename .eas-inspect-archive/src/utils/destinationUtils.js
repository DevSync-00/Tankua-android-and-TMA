/**
 * Utility functions for destination/tour data processing
 */

/**
 * Format distance with travel time estimate
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted string like "98 km • ~2h drive"
 */
export const formatDistanceWithTime = (distanceKm) => {
  if (!distanceKm || distanceKm === 0) return '';

  const timeMinutes = calculateTravelTime(distanceKm) * 60;
  const formattedTime = formatTravelTime(timeMinutes);

  return `${Math.round(distanceKm)} km • ${formattedTime} drive`;
};

/**
 * Format travel time from minutes to human readable string.
 * Examples:
 *  - 58 -> "~58m"
 *  - 118 -> "~1h 58m"
 *  - 200 -> "~3h 20m"
 */
export const formatTravelTime = (minutes) => {
  if (!minutes || minutes <= 0) return '';

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) {
    return `~${mins}m`;
  }

  if (mins === 0) {
    return `~${hours}h`;
  }

  return `~${hours}h ${mins}m`;
};

/**
 * Calculate estimated travel time in hours
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Estimated hours
 */
export const calculateTravelTime = (distanceKm) => {
  if (!distanceKm || distanceKm === 0) return 0;
  const avgSpeedKmh = 50;
  return distanceKm / avgSpeedKmh;
};

/**
 * Remove duplicate destinations based on name and location
 * @param {Array} destinations - Array of destination objects
 * @returns {Array} Deduplicated array
 */
export const deduplicateDestinations = (destinations) => {
  const seen = new Map();
  const result = [];
  
  for (const dest of destinations) {
    const key = `${dest.name?.toLowerCase().trim()}_${dest.city?.toLowerCase().trim()}_${dest.region?.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(dest);
    }
  }
  
  return result;
};

/**
 * Group destinations by region
 * @param {Array} destinations - Array of destination objects
 * @returns {Object} Object with region keys and destination arrays as values
 */
export const groupByRegion = (destinations) => {
  return destinations.reduce((acc, dest) => {
    const region = dest.region || 'Other';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(dest);
    return acc;
  }, {});
};

/**
 * Sort destinations by distance (nearest first)
 * @param {Array} destinations - Array of destination objects
 * @param {number} userLat - User's latitude (optional)
 * @param {number} userLng - User's longitude (optional)
 * @returns {Array} Sorted destinations
 */
export const sortByDistance = (destinations, userLat = null, userLng = null) => {
  if (!userLat || !userLng) {
    // If no user location, sort by distance field if available
    return [...destinations].sort((a, b) => {
      const distA = a.distance || 999999;
      const distB = b.distance || 999999;
      return distA - distB;
    });
  }
  
  // Calculate distance from user location
  const destinationsWithDistance = destinations.map(dest => {
    if (dest.location?.lat && dest.location?.lng) {
      const distance = calculateDistance(
        userLat,
        userLng,
        dest.location.lat,
        dest.location.lng
      );
      return { ...dest, calculatedDistance: distance };
    }
    return { ...dest, calculatedDistance: dest.distance || 999999 };
  });
  
  return destinationsWithDistance.sort((a, b) => 
    a.calculatedDistance - b.calculatedDistance
  );
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get average rating and review count for a destination
 * @param {Object} destination - Destination object
 * @returns {Object} { rating: number, reviewCount: number }
 */
export const getDestinationRating = (destination) => {
  // If destination has rating and review_count fields, use them
  if (destination.rating !== undefined && destination.review_count !== undefined) {
    return {
      rating: destination.rating,
      reviewCount: destination.review_count,
    };
  }
  
  // Default values if not available
  return {
    rating: 4.5, // Default rating
    reviewCount: 0,
  };
};

/**
 * Format rating with review count
 * @param {number} rating - Rating value
 * @param {number} reviewCount - Number of reviews
 * @returns {string} Formatted string like "4.8 (124 reviews)"
 */
export const formatRating = (rating, reviewCount) => {
  if (!rating) return '';
  
  const roundedRating = Math.round(rating * 10) / 10;
  
  if (reviewCount && reviewCount > 0) {
    return `${roundedRating} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`;
  }
  
  return `${roundedRating}`;
};
