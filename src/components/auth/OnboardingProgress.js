import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS } from '../../config/theme';
import { AUTH_COLORS } from './authTheme';

const DOT_HEIGHT = 7;
const DOT_RADIUS = 4;
const INACTIVE_WIDTH = 13;
const ACTIVE_WIDTH = 35;
const DOT_GAP = 8;

const ProgressDot = ({ index, scrollX, pageWidth }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const page = pageWidth > 0 ? scrollX.value / pageWidth : 0;
    const distance = Math.abs(page - index);

    const width = interpolate(
      distance,
      [0, 1],
      [ACTIVE_WIDTH, INACTIVE_WIDTH],
      Extrapolation.CLAMP
    );

    const backgroundColor = interpolateColor(
      distance,
      [0, 1],
      [COLORS.primary, AUTH_COLORS.dotInactive]
    );

    return {
      width,
      height: DOT_HEIGHT,
      borderRadius: DOT_RADIUS,
      backgroundColor,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

/**
 * Single animated progress track — width & color interpolate with scroll position.
 */
const OnboardingProgress = ({ count, scrollX, pageWidth }) => (
  <View style={styles.track} accessibilityRole="progressbar">
    {Array.from({ length: count }).map((_, index) => (
      <ProgressDot
        key={`onboarding-dot-${index}`}
        index={index}
        scrollX={scrollX}
        pageWidth={pageWidth}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOT_GAP,
    minHeight: DOT_HEIGHT,
    marginTop: 22,
    marginBottom: 4,
  },
});

export default OnboardingProgress;
