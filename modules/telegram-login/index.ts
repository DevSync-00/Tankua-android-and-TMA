import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

export interface TelegramLoginResult {
  idToken?: string;
  nonce?: string;
  error?: string;
  errorCode?: 'TELEGRAM_NOT_INSTALLED' | 'SDK_START_FAILED' | 'LOGIN_FAILED' | 'PARSING_FAILED';
}

let TelegramNativeModule: any = null;
try {
  TelegramNativeModule = requireNativeModule('TelegramLoginModule');
} catch (e) {
  // Graceful fallback when running in Expo Go or web environment
  console.warn('[TelegramLoginModule] Native module not available (requires custom dev client build):', e);
}

const emitter = TelegramNativeModule ? new EventEmitter(TelegramNativeModule) : null;

export function initTelegramLogin(clientId: string, redirectUri: string, scopes: string[] = ['profile', 'phone']): boolean {
  if (!TelegramNativeModule) return false;
  try {
    return TelegramNativeModule.init(clientId, redirectUri, scopes);
  } catch (e) {
    console.warn('[TelegramLoginModule] init failed:', e);
    return false;
  }
}

export function startTelegramNativeLogin(nonce?: string): boolean {
  if (!TelegramNativeModule) return false;
  try {
    return TelegramNativeModule.startLogin(nonce || null);
  } catch (e) {
    console.warn('[TelegramLoginModule] startLogin failed:', e);
    return false;
  }
}

export function addTelegramLoginListener(listener: (result: TelegramLoginResult) => void): Subscription {
  if (!emitter) {
    return { remove: () => {} } as Subscription;
  }
  return emitter.addListener('onTelegramLoginResult', listener);
}

export function isTelegramNativeAvailable(): boolean {
  return TelegramNativeModule !== null;
}
