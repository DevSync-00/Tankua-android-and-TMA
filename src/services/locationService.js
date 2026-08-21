import * as Location from 'expo-location';

/**
 * Requests location permissions, retrieves current GPS coordinates,
 * and reverse geocodes them to extract the current city / location name.
 * Includes a robust fallback to OpenStreetMap Nominatim API if Android native Geocoder fails.
 */
export const getCurrentCityLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Location permission not granted.' };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    let city = null;
    let formattedLocation = null;

    // 1. Try Expo/Android native reverse geocode
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        city = place.city || place.subregion || place.region || place.district || place.name;
        if (city) {
          formattedLocation = place.country ? `${city}, ${place.country}` : city;
        }
      }
    } catch (nativeGeocodeErr) {
      console.warn('[Location] Native reverseGeocodeAsync failed, switching to HTTP fallback:', nativeGeocodeErr?.message || nativeGeocodeErr);
    }

    // 2. If native geocoding failed or returned null, use OpenStreetMap Nominatim API
    if (!city) {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'TankuaApp/1.0',
            },
          }
        );
        const data = await resp.json();
        if (data && data.address) {
          const addr = data.address;
          city = addr.city || addr.town || addr.village || addr.suburb || addr.state || addr.county || 'Addis Ababa';
          formattedLocation = addr.country ? `${city}, ${addr.country}` : city;
        }
      } catch (nominatimErr) {
        console.warn('[Location] Nominatim reverse geocode failed:', nominatimErr?.message || nominatimErr);
      }
    }

    // 3. Fallback default if location services cannot resolve name
    if (!city) {
      city = 'Addis Ababa';
      formattedLocation = 'Addis Ababa, Ethiopia';
    }

    return {
      success: true,
      city: city,
      formattedLocation: formattedLocation,
      coords: { latitude, longitude },
    };
  } catch (error) {
    console.error('Error fetching current city location:', error);
    return { success: false, error: error.message || 'Failed to detect location.' };
  }
};
