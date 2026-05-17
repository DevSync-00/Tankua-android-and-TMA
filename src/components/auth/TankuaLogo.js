import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { SPACING } from '../../config/theme';
import { AUTH_COLORS, SERIF_FONT } from './authTheme';

const logoSource = require('../../../assets/favicon.png');

const TankuaLogo = ({ markSize = 104, showName = true, name = 'Tankua' }) => (
  <View style={styles.container}>
    <View style={[styles.markFrame, { width: markSize, height: markSize }]}>
      <Image
        source={logoSource}
        style={{ width: markSize, height: markSize }}
        resizeMode="contain"
      />
    </View>
    {showName ? <Text style={styles.wordmark}>{name}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  markFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: SPACING.sm + 2,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    color: '#16181F',
    letterSpacing: -1.2,
    textAlign: 'center',
  },
});

export default TankuaLogo;
