/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    expo: {
      name: 'Tankua',
      slug: 'tankua',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'automatic',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#FFB800',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.tankua.app',
        icon: {
          light: './assets/ios-light.png',
          dark: './assets/ios-dark.png',
          tinted: './assets/ios-tinted.png',
        },
        config: googleMapsApiKey
          ? { googleMapsApiKey }
          : undefined,
      },
      android: {
        softwareKeyboardLayoutMode: 'pan',
        adaptiveIcon: {
          foregroundImage: './assets/android-adaptive-icon.png',
          backgroundColor: '#FFB800',
        },
        package: 'com.tankua.co',
        permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA'],
        config: googleMapsApiKey
          ? { googleMaps: { apiKey: googleMapsApiKey } }
          : undefined,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: [
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#D4A017',
          },
        ],
        [
          'expo-splash-screen',
          {
            backgroundColor: '#FFB800',
            image: './assets/splash.png',
            resizeMode: 'contain',
            imageWidth: 288,
            dark: {
              backgroundColor: '#000000',
              image: './assets/splash-icon-dark.png',
              resizeMode: 'contain',
              imageWidth: 288,
            },
            android: { imageWidth: 288 },
          },
        ],
        [
          'expo-build-properties',
          {
            android: {
              enableMinifyInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
            },
          },
        ],
      ],
      extra: {
        eas: {
          projectId: 'c3026ea0-7f03-4a03-ad0a-6dda9f747582',
        },
        googleMapsApiKey,
      },
    },
  };
};
