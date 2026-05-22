import Constants from 'expo-constants';

/**
 * Google Maps Platform key (Places API New + Maps SDK).
 * Enable "Places API (New)" in Google Cloud Console.
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  '';

export const isGoogleMapsConfigured = () =>
  Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10);
