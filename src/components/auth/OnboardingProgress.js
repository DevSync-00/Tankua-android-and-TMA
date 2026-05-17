import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { COLORS } from '../../config/theme';
import { AUTH_COLORS } from './authTheme';

const DOT_HEIGHT = 7;
const DOT_RADIUS = 4;
const INACTIVE_WIDTH = 13;
const ACTIVE_WIDTH = 35;
const DOT_GAP = 8;
/** Distance between step centers (inactive dot + gap). */
const STEP_OFFSET = INACTIVE_WIDTH + DOT_GAP;

/**
 * One sliding gold pill over fixed inactive dots — single instance, smooth scroll-driven motion.
 */
const OnboardingProgress = ({ count, scrollX, pageWidth }) => {
  const trackWidth = (count - 1) * STEP_OFFSET + ACTIVE_WIDTH;

  const pillStyle = useAnimatedStyle(() => {
    const page = pageWidth > 0 ? scrollX.value / pageWidth : 0;
    return {
      transform: [{ translateX: page * STEP_OFFSET }],
    };
  });

  return (
    <View style={[styles.wrap, { width: trackWidth }]} accessibilityRole="progressbar">
      <View style={styles.dotsRow}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={`dot-bg-${index}`} style={styles.inactiveDot} />
        ))}
      </View>
      <Animated.View style={[styles.activePill, pillStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    height: DOT_HEIGHT,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_GAP,
  },
  inactiveDot: {
    width: INACTIVE_WIDTH,
    height: DOT_HEIGHT,
    borderRadius: DOT_RADIUS,
    backgroundColor: AUTH_COLORS.dotInactive,
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ACTIVE_WIDTH,
    height: DOT_HEIGHT,
    borderRadius: DOT_RADIUS,
    backgroundColor: COLORS.primary,
  },
});

export default OnboardingProgress;
