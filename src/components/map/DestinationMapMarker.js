import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../../config/theme';
import GooglePlaceIcon from './GooglePlaceIcon';

const MARKER_SIZE = 34;
const MARKER_SIZE_SELECTED = 38;
const PULSE_SIZE = 46;

/**
 * Map pin using Google Places official icons when available.
 */
const DestinationMapMarker = ({ destination, isSelected = false }) => {
  const bubbleSize = isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE;
  const accentColor = destination?.iconBackgroundColor || COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        { width: PULSE_SIZE, height: PULSE_SIZE + 6 },
      ]}
    >
      {isSelected && (
        <View
          style={[
            styles.pulse,
            {
              width: PULSE_SIZE,
              height: PULSE_SIZE,
              borderRadius: PULSE_SIZE / 2,
              borderColor: accentColor,
            },
          ]}
        />
      )}
      <View style={[styles.markerWrap, isSelected && styles.markerWrapSelected]}>
        <GooglePlaceIcon
          destination={destination}
          size={bubbleSize}
          selected={isSelected}
        />
      </View>
      <View style={[styles.pinTail, { borderTopColor: accentColor }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  containerSelected: {
    zIndex: 1000,
  },
  pulse: {
    position: 'absolute',
    top: 0,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.75,
  },
  markerWrap: {
    marginTop: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 999,
    ...SHADOWS.small,
  },
  markerWrapSelected: {
    borderWidth: 2.5,
    ...SHADOWS.medium,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

export default React.memo(DestinationMapMarker);
