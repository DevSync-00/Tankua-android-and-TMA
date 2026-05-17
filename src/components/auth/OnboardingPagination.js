import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';
import { AUTH_COLORS } from './authTheme';

const OnboardingPagination = ({ count, activeIndex }) => (
  <View style={styles.row}>
    {Array.from({ length: count }).map((_, index) => {
      const active = index === activeIndex;
      return (
        <View
          key={String(index)}
          style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 35,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 13,
    backgroundColor: AUTH_COLORS.dotInactive,
  },
});

export default OnboardingPagination;
