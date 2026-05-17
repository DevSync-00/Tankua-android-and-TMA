import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

/**
 * In-app Chapa checkout WebView
 */
const PaymentWebView = ({
  visible,
  checkoutUrl,
  onSuccess,
  onCancel,
  onError,
  providerName = 'Payment',
}) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const webViewRef = useRef(null);

  if (!visible || !checkoutUrl) {
    return null;
  }

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;

    if (
      url.includes('payment/success') ||
      url.includes('tx_ref=') ||
      (url.includes('callback') && url.includes('success')) ||
      url.includes('status=success')
    ) {
      onSuccess?.(url);
      return;
    }

    if (url.includes('payment/cancel') || url.includes('status=cancel') || url.includes('status=cancelled')) {
      onCancel?.();
      return;
    }

    if (url.includes('status=failed') || url.includes('status=error')) {
      onError?.('Payment failed');
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_SUCCESS') {
        onSuccess?.(data);
      } else if (data.type === 'PAYMENT_CANCELLED') {
        onCancel?.();
      } else if (data.type === 'PAYMENT_ERROR') {
        onError?.(data.message);
      }
    } catch {
      // ignore non-JSON messages
    }
  };

  const injectedJavaScript = `
    (function() {
      const observer = new MutationObserver(function() {
        const bodyText = document.body.innerText.toLowerCase();
        if (
          bodyText.includes('payment successful') ||
          bodyText.includes('transaction successful') ||
          bodyText.includes('payment complete')
        ) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS' }));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color={COLORS.secondary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="lock-closed" size={16} color={COLORS.success} />
            <Text style={styles.title}>Secure {providerName} Checkout</Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.max(progress, 0.05) * 100}%` }]} />
          </View>
        ) : null}

        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading secure checkout...</Text>
            </View>
          )}
          onError={() => {
            onError?.('Failed to load payment page');
          }}
        />

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.footerText}>Your payment is secured with 256-bit encryption</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    height: 3,
    backgroundColor: COLORS.lightGray,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
});

export default PaymentWebView;
