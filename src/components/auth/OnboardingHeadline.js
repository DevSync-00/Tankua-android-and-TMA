import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../config/theme';
import { AUTH_COLORS, SERIF_FONT } from './authTheme';

/** Headline + gold highlight + per-slide swoosh PNG (typography built in code). */
const OnboardingHeadline = ({ prefix, highlight, underlineSource }) => (
  <View style={styles.container}>
    <Text style={styles.prefix}>{prefix}</Text>
    <Text style={styles.highlight}>{highlight}</Text>
    <Image source={underlineSource} style={styles.underline} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 330,
    alignSelf: 'center',
  },
  prefix: {
    fontSize: 30,
    fontWeight: FONTS.weights.bold,
    fontFamily: SERIF_FONT,
    color: AUTH_COLORS.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  highlight: {
    marginTop: 2,
    fontSize: 30,
    fontWeight: FONTS.weights.bold,
    fontFamily: SERIF_FONT,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  underline: {
    width: 148,
    height: 14,
    marginTop: 6,
  },
});

export default OnboardingHeadline;
