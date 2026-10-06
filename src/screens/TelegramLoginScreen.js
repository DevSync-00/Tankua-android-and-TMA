import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  AppState,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { AUTH_COLORS, authStyles } from '../components/auth/authTheme';
import TankuaLogo from '../components/auth/TankuaLogo';
import AuthWaves from '../components/auth/AuthWaves';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';

import {
  isNativeTelegramLoginSupported,
  performTelegramNativeLogin,
} from '../services/telegramNativeAuth';

// ---------------------------------------------------------------------------
// Flow overview:
//  Native Flow:
//   1. Taps Telegram button -> performTelegramNativeLogin() launches native SDK intent.
//   2. User authenticates inside Telegram app -> App Link callback fires -> id_token returned.
//   3. POST id_token to Edge Function (/functions/v1/telegram-oidc) -> session set.
//  Fallback Flow (WebView/Browser):
//   1. Open oauth.telegram.org/auth?bot_id=...&origin=...&return_to=...
//   2. User authenticates in web/app -> Telegram redirects to return_to with #tgAuthResult=...
//   3. Intercept payload, decode, POST to /functions/v1/telegram-auth -> session set.
// ---------------------------------------------------------------------------

const BOT_ID = process.env.EXPO_PUBLIC_TELEGRAM_BOT_ID ?? '';
const AUTH_MODE = process.env.EXPO_PUBLIC_TELEGRAM_AUTH_MODE || 'native';
const BOT_USERNAME = process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME || 'tankuaverifybot';

const TelegramIcon = ({ size = 28, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 640">
    <Path
      d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"
      fill={color}
    />
  </Svg>
);

const getWidgetHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #FFFFFF;
      font-family: -apple-system, Roboto, sans-serif;
    }
  </style>
  <script type="text/javascript">
    function onTelegramAuth(user) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'TELEGRAM_AUTH_USER',
          user: user
        }));
      }
    }
  </script>
</head>
<body>
  <script async src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login="${BOT_USERNAME}"
          data-size="large"
          data-radius="14"
          data-onauth="onTelegramAuth(user)"
          data-request-access="write"></script>
</body>
</html>
`;

const INJECTED_JS = `
(function() {
  try {
    window.open = function(url) {
      if (url) window.location.href = url;
    };
    document.addEventListener('click', function(e) {
      var a = e.target && e.target.closest && e.target.closest('a');
      if (a && a.target === '_blank') {
        a.target = '_self';
      }
    }, true);
  } catch(e) {}
  try {
    document.cookie.split(';').forEach(function(c) {
      var name = c.trim().split('=')[0];
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.telegram.org';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/domain=oauth.telegram.org';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  } catch(e) {}

  function checkHash() {
    try {
      var hash = window.location.hash;
      if (hash && hash.indexOf('tgAuthResult=') !== -1) {
        var idx = hash.indexOf('tgAuthResult=');
        var result = hash.slice(idx + 'tgAuthResult='.length);
        if (result) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'tgAuthResult', data: result })
          );
        }
      }
    } catch(e) {}
  }

  checkHash();
  window.addEventListener('hashchange', checkHash);

  var origPush = history.pushState;
  history.pushState = function() { origPush.apply(this, arguments); checkHash(); };
  var origReplace = history.replaceState;
  history.replaceState = function() { origReplace.apply(this, arguments); checkHash(); };

  var origError = console.error;
  console.error = function() {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'consoleError', msg: Array.from(arguments).join(' ') })
    );
    origError.apply(this, arguments);
  };

  true;
})();
`;

function decodeTgAuthResult(raw) {
  try {
    const str = raw.split('&')[0];
    const urlDecoded = decodeURIComponent(str);
    if (urlDecoded.startsWith('{')) {
      return JSON.parse(urlDecoded);
    }
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(decoded);
  } catch (e) {
    console.warn('[TelegramLoginScreen] decodeTgAuthResult failed:', e.message);
    return null;
  }
}

const TelegramLoginScreen = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const { loginWithTelegram, loginWithTelegramNative } = useAuth();
  const { showToast } = useFeedback();
  const webViewRef = useRef(null);

  const processingRef = useRef(false);
  const pageLoadedRef = useRef(false);
  const nativeLoginSupported = isNativeTelegramLoginSupported();

  const [useWebViewFallback, setUseWebViewFallback] = useState(
    AUTH_MODE === 'webview' || !nativeLoginSupported,
  );

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDelayedFallback, setShowDelayedFallback] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const [webViewKey, setWebViewKey] = useState('initial');
  const [nonce, setNonce] = useState(() => Math.random().toString(36).slice(2));

  const topWaveHeight = Math.max(110, Math.min(height * 0.18, 150));
  const bottomWaveHeight = Math.max(140, Math.min(height * 0.22, 190));

  // Option C: Gracefully reveal secondary fallback only if device is delayed > 7s
  useEffect(() => {
    let timer = null;
    if (isProcessing) {
      setShowDelayedFallback(false);
      timer = setTimeout(() => {
        setShowDelayedFallback(true);
      }, 7000);
    } else {
      setShowDelayedFallback(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing]);

  const triggerNativeLogin = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const { idToken, nonce: authNonce } = await performTelegramNativeLogin();
      await loginWithTelegramNative(idToken, authNonce);
    } catch (err) {
      console.warn('[TelegramLoginScreen] Native login attempt error:', err);
      processingRef.current = false;
      setIsProcessing(false);

      const shouldUseFallback = [
        'NATIVE_MODULE_UNAVAILABLE',
        'TELEGRAM_NOT_INSTALLED',
        'SDK_START_FAILED',
      ].includes(err?.code);

      if (shouldUseFallback) {
        pageLoadedRef.current = false;
        setFatalError(null);
        setIsPageLoading(true);
        setUseWebViewFallback(true);
        setWebViewKey(`fallback-${Date.now()}`);
        return;
      }

      showToast({
        type: 'error',
        title: 'Login Failed',
        message: err.message || 'Could not complete Telegram login. Please try again.',
      });
    }
  };

  useEffect(() => {
    if (AUTH_MODE === 'native' && nativeLoginSupported) {
      triggerNativeLogin();
    }
  }, []);

  // Watch for app resume when returning from Telegram without callback (user cancellation)
  useEffect(() => {
    let resumeTimer = null;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && processingRef.current) {
        // Give 2.5s grace period for callback deep-link intent to be processed.
        resumeTimer = setTimeout(() => {
          if (processingRef.current) {
            console.log('[TelegramLoginScreen] User resumed without callback, clearing processing state');
            processingRef.current = false;
            setIsProcessing(false);
          }
        }, 2500);
      }
    });

    return () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('webview_reset_key').then((val) => {
      if (val) {
        setWebViewKey(`reset-${val}`);
        setNonce(Math.random().toString(36).slice(2));
      }
    });
  }, []);

  // ── Auth result handler ──────────────────────────────────────────────────
  const handleTelegramResult = useCallback(
    async (base64Result) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);

      try {
        const authData = decodeTgAuthResult(base64Result);
        if (!authData || !authData.id || !authData.hash) {
          throw new Error('Invalid Telegram auth payload.');
        }
        await loginWithTelegram(authData);
      } catch (err) {
        processingRef.current = false;
        setIsProcessing(false);
        showToast({
          type: 'error',
          title: 'Login Failed',
          message: err.message || 'Could not complete Telegram login. Please try again.',
        });
      }
    },
    [loginWithTelegram, showToast],
  );

  // ── URL interception (fragment-based redirect) ───────────────────────────
  const extractResult = (url = '') => {
    const idx = url.indexOf('#tgAuthResult=');
    if (idx !== -1) return url.slice(idx + '#tgAuthResult='.length);
    return null;
  };

  const handleNavigationStateChange = useCallback(
    (navState) => {
      const result = extractResult(navState.url);
      if (result) handleTelegramResult(result);
    },
    [handleTelegramResult],
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request) => {
      if (request.url?.startsWith('tg://')) {
        Linking.openURL(request.url).catch(() => {});
        return false;
      }
      const result = extractResult(request.url);
      if (result) {
        handleTelegramResult(result);
        return false;
      }
      return true;
    },
    [handleTelegramResult],
  );

  // ── Messages from injected JS ────────────────────────────────────────────
  const handleMessage = useCallback(
    async (event) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg?.type === 'TELEGRAM_AUTH_USER' && msg?.user?.id) {
          if (processingRef.current) return;
          processingRef.current = true;
          setIsProcessing(true);
          try {
            await loginWithTelegram(msg.user);
          } catch (err) {
            processingRef.current = false;
            setIsProcessing(false);
            showToast({
              type: 'error',
              title: 'Login Failed',
              message: err.message || 'Could not complete Telegram login. Please try again.',
            });
          }
        } else if (msg?.type === 'tgAuthResult' && msg?.data) {
          handleTelegramResult(msg.data);
        } else if (msg?.type === 'consoleError') {
          console.warn('[TelegramWebView]', msg.msg);
        }
      } catch {
        // Ignore non-JSON messages
      }
    },
    [handleTelegramResult, loginWithTelegram, showToast],
  );

  // ── Load state handlers ──────────────────────────────────────────────────
  const handleLoadStart = useCallback(() => {
    if (!pageLoadedRef.current) setIsPageLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    pageLoadedRef.current = true;
    setIsPageLoading(false);
  }, []);

  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    if (!pageLoadedRef.current) {
      setIsPageLoading(false);
      setFatalError(nativeEvent?.description || 'Could not load Telegram login page.');
    }
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    if (nativeEvent?.statusCode >= 400 && !pageLoadedRef.current) {
      setIsPageLoading(false);
      setFatalError(`Telegram returned HTTP ${nativeEvent.statusCode}.`);
    }
  }, []);

  const handleRetry = () => {
    processingRef.current = false;
    pageLoadedRef.current = false;
    const newNonce = Math.random().toString(36).slice(2);
    setNonce(newNonce);
    setWebViewKey(`retry-${newNonce}`);
    setFatalError(null);
    setIsProcessing(false);
    setIsPageLoading(true);
  };

  const handleBack = () => {
    if (useWebViewFallback && nativeLoginSupported && AUTH_MODE === 'native') {
      setUseWebViewFallback(false);
    } else {
      navigation.goBack();
    }
  };

  // ── Bot Configuration Missing View ───────────────────────────────────────
  if (useWebViewFallback && !BOT_ID) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeContent} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity style={authStyles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Telegram Sign-In</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.centeredContent}>
            <Ionicons name="settings-outline" size={52} color={COLORS.primary} />
            <Text style={styles.setupTitle}>Bot ID not configured</Text>
            <Text style={styles.setupBody}>
              Add to your .env file:{'\n\n'}
              <Text style={styles.setupCode}>EXPO_PUBLIC_TELEGRAM_BOT_ID=your_bot_id</Text>
              {'\n\n'}
              Get your bot ID from @BotFather, then register your domain with /setdomain.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative Tankua brand waves */}
      <View style={styles.wavesLayer} pointerEvents="none">
        <AuthWaves topHeight={topWaveHeight} bottomHeight={bottomWaveHeight} />
      </View>

      <SafeAreaView style={styles.safeContent} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={authStyles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Telegram Sign-In</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!useWebViewFallback ? (
          /* Native Flow Experience */
          <View style={styles.nativeContent}>
            {/* Connection Visual Brand Badges */}
            <View style={styles.brandBadgeRow}>
              <View style={styles.tankuaBadgeCircle}>
                <TankuaLogo markSize={42} showName={false} />
              </View>

              <View style={styles.connectionLineContainer}>
                <View style={styles.connectionLine} />
                <View style={styles.connectionPill}>
                  <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                </View>
                <View style={styles.connectionLine} />
              </View>

              <View style={[styles.telegramBadgeCircle, isProcessing && styles.telegramBadgeActive]}>
                <TelegramIcon size={34} color="#FFFFFF" />
              </View>
            </View>

            {isProcessing ? (
              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>Opening Telegram…</Text>
                <Text style={styles.statusSubtitle}>
                  Please confirm the one-tap sign-in prompt inside the Telegram app to continue to Tankua.
                </Text>

                <View style={styles.spinnerRow}>
                  <ActivityIndicator size="small" color={COLORS.primaryDark} />
                  <Text style={styles.spinnerText}>Waiting for authorization…</Text>
                </View>

                {/* Trust Pills */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadge}>
                    <Ionicons name="lock-closed-outline" size={12} color={COLORS.grayDark} />
                    <Text style={styles.trustBadgeText}>End-to-End Secure</Text>
                  </View>
                  <View style={styles.trustBadge}>
                    <Ionicons name="flash-outline" size={12} color={COLORS.grayDark} />
                    <Text style={styles.trustBadgeText}>Instant 1-Tap</Text>
                  </View>
                </View>

                {/* Delayed Fallback Prompt (After 7s) */}
                {showDelayedFallback && (
                  <View style={styles.delayedPromptCard}>
                    <Text style={styles.delayedPromptText}>
                      Taking longer than usual? You can continue directly with your web browser.
                    </Text>
                    <TouchableOpacity
                      style={styles.delayedWebButton}
                      onPress={() => {
                        processingRef.current = false;
                        setIsProcessing(false);
                        setUseWebViewFallback(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="globe-outline" size={16} color="#229ED9" />
                      <Text style={styles.delayedWebButtonText}>Continue with Web Browser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.statusSection}>
                <Text style={styles.statusTitle}>Authorize with Telegram</Text>
                <Text style={styles.statusSubtitle}>
                  Sign in instantly with your verified Telegram account to view destinations, bookings, and platform features.
                </Text>

                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.telegramPrimaryButton}
                    onPress={triggerNativeLogin}
                    activeOpacity={0.85}
                  >
                    <TelegramIcon size={24} color="#FFFFFF" />
                    <Text style={styles.telegramPrimaryButtonText}>Open Telegram App</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.webSecondaryButton}
                    onPress={() => {
                      processingRef.current = false;
                      setIsProcessing(false);
                      setUseWebViewFallback(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="globe-outline" size={18} color="#1A1A2E" />
                    <Text style={styles.webSecondaryButtonText}>Sign In via Web Browser</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.termsNote}>
                  By continuing, you agree to Tankua's Terms of Service and Privacy Policy.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Web Fallback Container */
          <View style={styles.webViewWrapper}>
            <View style={styles.webNoticeBar}>
              <Ionicons name="information-circle-outline" size={18} color="#229ED9" />
              <Text style={styles.webNoticeText}>
                Enter your phone number below to receive an authorization code in Telegram.
              </Text>
            </View>

            <View style={styles.webViewCard}>
              {fatalError ? (
                <View style={styles.centeredContent}>
                  <Ionicons name="warning-outline" size={48} color={COLORS.error} />
                  <Text style={styles.errorText}>{fatalError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <WebView
                  key={webViewKey}
                  ref={webViewRef}
                  source={{
                    html: getWidgetHtml(),
                    baseUrl: 'https://www.tankua.co',
                  }}
                  style={styles.webView}
                  injectedJavaScript={INJECTED_JS}
                  onNavigationStateChange={handleNavigationStateChange}
                  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                  onMessage={handleMessage}
                  onLoadStart={handleLoadStart}
                  onLoadEnd={handleLoadEnd}
                  onError={handleError}
                  onHttpError={handleHttpError}
                  javaScriptEnabled
                  domStorageEnabled
                  setSupportMultipleWindows={false}
                  incognito={true}
                  allowsInlineMediaPlayback
                  originWhitelist={['https://*', 'http://*', 'tg://*']}
                  userAgent={
                    Platform.OS === 'android'
                      ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
                      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                  }
                />
              )}

              {/* In-App Widget Loading Overlay */}
              {(isPageLoading || isProcessing) && !fatalError && (
                <View style={styles.overlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.overlayText}>
                    {isProcessing ? 'Signing you in…' : 'Loading Telegram Widget…'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wavesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  safeContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1E28',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  nativeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  tankuaBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF8E6',
    borderWidth: 2,
    borderColor: '#FFE6A6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  connectionLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  connectionLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  connectionPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  telegramBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#229ED9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#229ED9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  telegramBadgeActive: {
    borderWidth: 3,
    borderColor: 'rgba(34, 158, 217, 0.35)',
  },
  statusSection: {
    width: '100%',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B1E28',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#7D848D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#FFF8E6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE6A6',
    marginBottom: 16,
  },
  spinnerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  delayedPromptCard: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  delayedPromptText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  delayedWebButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#229ED9',
  },
  delayedWebButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#229ED9',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  telegramPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#229ED9',
    gap: 10,
    elevation: 2,
    shadowColor: '#229ED9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  telegramPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  webSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  webSecondaryButtonText: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '600',
  },
  termsNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  webViewWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  webNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  webNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  webViewCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  webView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  overlayText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    fontWeight: '500',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  setupTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  setupBody: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  setupCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
  },
});

export default TelegramLoginScreen;
