import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_LAYOUT } from './authTheme';
import OnboardingHeadline from './OnboardingHeadline';

const OnboardingSlide = ({
  slideIndex,
  scrollX,
  pageWidth,
  HeroImage,
  prefix,
  highlight,
  description,
  underlineSource,
  onSkip,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * 0.52);

  const contentStyle = useAnimatedStyle(() => {
    if (!pageWidth) return {};
    const position = scrollX.value / pageWidth;
    const distance = Math.abs(position - slideIndex);
    return {
      opacity: interpolate(distance, [0, 0.85, 1], [1, 0.5, 0.25], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(distance, [0, 1], [0, 14], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const heroStyle = useAnimatedStyle(() => {
    if (!pageWidth) return {};
    const position = scrollX.value / pageWidth;
    const distance = position - slideIndex;
    return {
      transform: [
        {
          translateX: interpolate(
            distance,
            [-1, 0, 1],
            [pageWidth * 0.08, 0, -pageWidth * 0.08],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.heroWrap, { height: heroHeight, width }]}>
        <Animated.View style={[{ width, height: heroHeight }, heroStyle]}>
          <HeroImage
            width={width}
            height={heroHeight}
            preserveAspectRatio="xMidYMid slice"
          />
        </Animated.View>
        <Pressable
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={onSkip}
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color={AUTH_COLORS.text} />
        </Pressable>
      </View>

      <Animated.View style={[styles.content, contentStyle]}>
        <OnboardingHeadline
          prefix={prefix}
          highlight={highlight}
          underlineSource={underlineSource}
        />
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
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
