import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../config/theme';

const WAVE_PATHS = {
  top: 'M0,78 C70,25 150,120 240,60 C300,20 345,60 375,30 L375,0 L0,0 Z',
  bottom: 'M0,40 C70,90 160,0 240,60 C300,110 350,80 375,95 L375,120 L0,120 Z',
};

const AuthWaves = ({ topHeight, bottomHeight }) => (
  <>
    <View pointerEvents="none" style={[styles.wave, styles.waveTop, { height: topHeight }]}>
      <Svg width="100%" height="100%" viewBox="0 0 375 120" preserveAspectRatio="none">
        <Path d={WAVE_PATHS.top} fill={COLORS.primary} />
      </Svg>
    </View>
    <View pointerEvents="none" style={[styles.wave, styles.waveBottom, { height: bottomHeight }]}>
      <Svg width="100%" height="100%" viewBox="0 0 375 120" preserveAspectRatio="none">
        <Path d={WAVE_PATHS.bottom} fill={COLORS.primary} />
      </Svg>
    </View>
  </>
);

const styles = StyleSheet.create({
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  waveTop: {
    top: 0,
  },
  waveBottom: {
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default AuthWaves;
