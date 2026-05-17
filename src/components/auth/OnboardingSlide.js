import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';
import OnboardingHeadline from './OnboardingHeadline';
import OnboardingProgress from './OnboardingProgress';
import AuthPrimaryButton from './AuthPrimaryButton';

const OnboardingSlide = ({
  HeroImage,
  prefix,
  highlight,
  description,
  underlineSource,
  slideCount,
  scrollX,
  pageWidth,
  ctaLabel,
  onContinue,
  onSkip,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * 0.52);

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.heroWrap, { height: heroHeight, width }]}>
        <HeroImage
          width={width}
          height={heroHeight}
          preserveAspectRatio="xMidYMid slice"
        />
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
          <OnboardingHeadline
            prefix={prefix}
            highlight={highlight}
            underlineSource={underlineSource}
          />
          <Text style={styles.description}>{description}</Text>
          <OnboardingProgress
            count={slideCount}
            scrollX={scrollX}
            pageWidth={pageWidth}
          />
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
    overflow: 'hidden',
    borderBottomLeftRadius: AUTH_LAYOUT.heroRadius,
    borderBottomRightRadius: AUTH_LAYOUT.heroRadius,
    backgroundColor: '#F3F3F3',
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
    paddingTop: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  copyBlock: {
    flexShrink: 1,
    alignItems: 'center',
  },
  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 24,
    color: AUTH_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 4,
    maxWidth: 330,
  },
});

export default OnboardingSlide;
