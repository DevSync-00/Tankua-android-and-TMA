import Constants from 'expo-constants';
import {
  initTelegramLogin,
  startTelegramNativeLogin,
  addTelegramLoginListener,
  isTelegramNativeAvailable,
} from '../../modules/telegram-login';

const CLIENT_ID =
  Constants.expoConfig?.extra?.telegramClientId ||
  process.env.EXPO_PUBLIC_TELEGRAM_OIDC_CLIENT_ID ||
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID ||
  '8319181574';

const REDIRECT_URI = 'https://app112396380-login.tg.dev/tglogin';

let isInitialized = false;

export function isNativeTelegramLoginSupported() {
  return isTelegramNativeAvailable();
}

export function ensureTelegramNativeInitialized() {
  if (!isTelegramNativeAvailable()) return false;
  if (!isInitialized) {
    isInitialized = initTelegramLogin(CLIENT_ID, REDIRECT_URI, ['profile', 'phone']);
  }
  return isInitialized;
}

export function generateAuthNonce() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function performTelegramNativeLogin() {
  return new Promise((resolve, reject) => {
    if (!isTelegramNativeAvailable()) {
      return reject({
        code: 'NATIVE_MODULE_UNAVAILABLE',
        message: 'Native Telegram module is not available in current environment.',
      });
    }

    ensureTelegramNativeInitialized();
    const nonce = generateAuthNonce();

    let subscription = null;

    const cleanup = () => {
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
    };

    subscription = addTelegramLoginListener((result) => {
      cleanup();

      if (result.error || result.errorCode) {
        return reject({
          code: result.errorCode || 'LOGIN_FAILED',
          message: result.error || 'Telegram login failed',
          nonce,
        });
      }

      if (result.idToken) {
        return resolve({
          idToken: result.idToken,
          nonce: result.nonce || nonce,
        });
      }

      return reject({
        code: 'UNKNOWN_RESPONSE',
        message: 'No id_token returned from Telegram',
        nonce,
      });
    });

    const started = startTelegramNativeLogin(nonce);
    if (!started) {
      cleanup();
      reject({
        code: 'SDK_START_FAILED',
        message: 'Failed to launch Telegram native login intent',
        nonce,
      });
    }
  });
}
