import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

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

const ORIGIN = 'https://www.tankua.co';
const RETURN_TO = 'https://dotjlikaurcjwabarqcy.supabase.co/functions/v1/telegram-auth';

const getWidgetHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #FAF8F5;
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
          data-telegram-login="tankua_auth_bot"
          data-size="large"
          data-radius="10"
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
  const { loginWithTelegram, loginWithTelegramNative } = useAuth();
  const webViewRef = useRef(null);

  const processingRef = useRef(false);
  const pageLoadedRef = useRef(false);

  const [useWebViewFallback, setUseWebViewFallback] = useState(
    AUTH_MODE === 'webview',
  );

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const [webViewKey, setWebViewKey] = useState('initial');
  const [nonce, setNonce] = useState(() => Math.random().toString(36).slice(2));

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
      Alert.alert(
        'Login Failed',
        err.message || 'Could not complete Telegram login. Please try again.',
        [{ text: 'OK' }],
      );
    }
  };

  useEffect(() => {
    if (AUTH_MODE === 'native') {
      triggerNativeLogin();
    }
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
        console.warn('[Telegram Debug] decoded auth data:', JSON.stringify({
          ...authData,
          hash: authData?.hash?.slice(0, 8) + '...',
        }));
        if (!authData || !authData.id || !authData.hash) {
          throw new Error('Invalid Telegram auth payload.');
        }
        await loginWithTelegram(authData);
        // AppNavigator detects user change and navigates automatically.
      } catch (err) {
        processingRef.current = false;
        setIsProcessing(false);
        Alert.alert(
          'Login Failed',
          err.message || 'Could not complete Telegram login. Please try again.',
          [{ text: 'OK' }],
        );
      }
    },
    [loginWithTelegram],
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
            Alert.alert(
              'Login Failed',
              err.message || 'Could not complete Telegram login. Please try again.',
              [{ text: 'OK' }],
            );
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
    [handleTelegramResult, loginWithTelegram],
  );

  // ── Load state handlers ──────────────────────────────────────────────────
  const handleLoadStart = useCallback(() => {
    if (!pageLoadedRef.current) setIsPageLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    pageLoadedRef.current = true;
    setIsPageLoading(false);
  }, []);

  // Only treat HTTP errors (4xx/5xx) or complete network failures as fatal.
  // Sub-resource errors (images, iframes) fire onError too — ignore those.
  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('[TelegramWebView] error:', nativeEvent);
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

  // ── Render ───────────────────────────────────────────────────────────────
  if (!BOT_ID) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <View style={styles.backButtonCircle}>
                <Ionicons name="chevron-back" size={22} color="#000" />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Continue with Telegram</Text>
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Continue with Telegram</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.webViewContainer}>
          {/* Fatal error replaces entire WebView area */}
          {fatalError ? (
            <View style={styles.centeredContent}>
              <Ionicons name="warning-outline" size={52} color={COLORS.error} />
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

          {/* Spinner overlay — only while initial page is loading */}
          {(isPageLoading || isProcessing) && !fatalError && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.overlayText}>
                {isProcessing ? 'Signing you in…' : 'Loading…'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: { padding: 4 },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
  },
  headerSpacer: { width: 48 },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
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
