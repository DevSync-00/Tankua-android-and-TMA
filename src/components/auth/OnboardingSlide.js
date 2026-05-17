import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';
import OnboardingHeadline from './OnboardingHeadline';
import OnboardingPagination from './OnboardingPagination';
import AuthPrimaryButton from './AuthPrimaryButton';

const OnboardingSlide = ({
  heroSource,
  prefix,
  highlight,
  description,
  slideIndex,
  slideCount,
  ctaLabel,
  onContinue,
  onSkip,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * 0.52);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.heroWrap, { height: heroHeight }]}>
        <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
        <Pressable
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={onSkip}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color={AUTH_COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <OnboardingHeadline prefix={prefix} highlight={highlight} />
          <Text style={styles.description}>{description}</Text>
          <OnboardingPagination count={slideCount} activeIndex={slideIndex} />
        </View>
        <AuthPrimaryButton label={ctaLabel} onPress={onContinue} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroWrap: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: AUTH_LAYOUT.heroRadius,
    borderBottomRightRadius: AUTH_LAYOUT.heroRadius,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    right: AUTH_LAYOUT.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AUTH_COLORS.skipOverlay,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: AUTH_LAYOUT.screenPadding,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  copyBlock: {
    flexShrink: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: AUTH_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 12,
  },
});

export default OnboardingSlide;
