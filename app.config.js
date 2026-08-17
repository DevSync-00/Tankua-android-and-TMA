const { withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');

const telegramClientId = process.env.EXPO_PUBLIC_TELEGRAM_OIDC_CLIENT_ID || process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID || '8319181574';

/** Expo Config Plugin to inject Telegram Login Manifest Activity & Gradle Repositories */
const withTelegramLogin = (config) => {
  let updatedConfig = withAndroidManifest(config, (cfg) => {
    const androidManifest = cfg.modResults;
    const application = androidManifest.manifest.application[0];
    
    // Check if TelegramLoginCallbackActivity is already added
    const existingActivity = application.activity?.find(
      (a) => a.$['android:name'] === 'com.tankua.telegramlogin.TelegramLoginCallbackActivity'
    );

    // Ensure queries section has Telegram package for Android 11+ package visibility
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [{}];
    }
    const queriesObj = androidManifest.manifest.queries[0] || {};
    if (!queriesObj.package) queriesObj.package = [];
    const tgPackages = ['org.telegram.messenger', 'org.telegram.messenger.web', 'org.telegram.messenger.beta'];
    tgPackages.forEach((pkg) => {
      const exists = queriesObj.package.some((p) => p.$?.['android:name'] === pkg);
      if (!exists) {
        queriesObj.package.push({ $: { 'android:name': pkg } });
      }
    });

    if (!existingActivity) {
      if (!application.activity) application.activity = [];
      application.activity.push({
        $: {
          'android:name': 'com.tankua.telegramlogin.TelegramLoginCallbackActivity',
          'android:exported': 'true',
          'android:launchMode': 'singleTask',
        },
        'intent-filter': [
          {
            $: { 'android:autoVerify': 'true' },
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            category: [
              { $: { 'android:name': 'android.intent.category.DEFAULT' } },
              { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
            ],
            data: [
              {
                $: {
                  'android:scheme': 'https',
                  'android:host': 'app112396380-login.tg.dev',
                  'android:pathPrefix': '/tglogin',
                },
              },
            ],
          },
        ],
      });
    }
    return cfg;
  });

  return updatedConfig;
};

/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => {
  const baseExpo = config.expo || {};
  return {
    ...config,
    expo: {
      ...baseExpo,
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
      },
      android: {
        softwareKeyboardLayoutMode: 'pan',
        adaptiveIcon: {
          foregroundImage: './assets/android-adaptive-icon.png',
          backgroundColor: '#FFB800',
        },
        package: 'com.tankua.co',
        permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA'],
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: 'app112396380-login.tg.dev',
                pathPrefix: '/tglogin',
              },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
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
              enableMinifyInReleaseBuilds: false,
              enableShrinkResourcesInReleaseBuilds: false,
              ndkVersion: '27.1.12297006',
            },
          },
        ],
        withTelegramLogin,
      ],
      extra: {
        eas: {
          projectId: 'c3026ea0-7f03-4a03-ad0a-6dda9f747582',
        },
        telegramClientId: telegramClientId,
        telegramAuthMode: process.env.EXPO_PUBLIC_TELEGRAM_AUTH_MODE || 'native',
      },
    },
  };
};

