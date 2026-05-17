import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_LAYOUT, authStyles } from './authTheme';
import AuthWaves from './AuthWaves';

const AuthScreenLayout = ({
  children,
  onBack,
  showBack = true,
  contentStyle,
  scrollProps,
}) => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const topWaveHeight = Math.max(110, Math.min(height * 0.18, 150));
  const bottomWaveHeight = Math.max(140, Math.min(height * 0.22, 190));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative waves — root-level, never inside keyboard-avoiding layout */}
      <View style={styles.wavesLayer} pointerEvents="none">
        <AuthWaves topHeight={topWaveHeight} bottomHeight={bottomWaveHeight} />
      </View>

      <SafeAreaView style={styles.safeContent} edges={['left', 'right', 'top']}>
        {showBack && onBack ? (
          <Pressable
            style={[authStyles.backButton, styles.backPosition, { top: insets.top + 8 }]}
            onPress={onBack}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
          </Pressable>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            authStyles.scrollContent,
            {
              paddingTop: insets.top + topWaveHeight * 0.32,
              paddingBottom: bottomWaveHeight * 0.55 + insets.bottom + 24,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          bounces={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backPosition: {
    position: 'absolute',
    left: AUTH_LAYOUT.screenPadding,
    zIndex: 3,
  },
});

export default AuthScreenLayout;
