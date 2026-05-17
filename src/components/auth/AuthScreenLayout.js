import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
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
  const bottomWaveHeight = Math.max(140, Math.min(height * 0.22, 190)) + insets.bottom;

  return (
    <SafeAreaView style={authStyles.screen} edges={['left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <AuthWaves topHeight={topWaveHeight} bottomHeight={bottomWaveHeight} />

      {showBack && onBack ? (
        <Pressable
          style={[authStyles.backButton, styles.backPosition, { top: insets.top + 8 }]}
          onPress={onBack}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            authStyles.scrollContent,
            {
              paddingTop: insets.top + topWaveHeight * 0.35,
              paddingBottom: bottomWaveHeight + 28,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backPosition: {
    position: 'absolute',
    left: AUTH_LAYOUT.screenPadding,
  },
});

export default AuthScreenLayout;
