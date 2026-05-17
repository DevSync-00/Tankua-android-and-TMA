import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../../config/theme';
import { authStyles } from './authTheme';

const logoSource = require('../../../assets/favicon.png');

const TankuaLogo = ({ size = 88, showName = true, name = 'Tankua' }) => (
  <View style={styles.container}>
    <View style={[styles.logoFrame, { width: size + 8, height: size + 8 }]}>
      <Image
        source={logoSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
    {showName ? (
      <Text style={[authStyles.brandName, { fontSize: Math.max(FONTS.sizes.xxxl, size * 0.42) }]}>
        {name}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TankuaLogo;
