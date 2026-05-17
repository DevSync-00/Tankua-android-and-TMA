import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../config/theme';
import { AUTH_COLORS, SERIF_FONT } from './authTheme';

const highlightUnderline = require('../../../assets/SplashScreenOnbordingLoginPages/Vector 255.png');

const OnboardingHeadline = ({ prefix, highlight }) => (
  <View style={styles.container}>
    <Text style={styles.prefix}>
      {prefix}
      {'\n'}
      <Text style={styles.highlight}>{highlight}</Text>
    </Text>
    <Image source={highlightUnderline} style={styles.underline} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  prefix: {
    fontSize: 28,
    fontWeight: FONTS.weights.bold,
    fontFamily: SERIF_FONT,
    color: AUTH_COLORS.text,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  highlight: {
    color: COLORS.primary,
  },
  underline: {
    width: 120,
    height: 12,
    marginTop: 4,
  },
});

export default OnboardingHeadline;
