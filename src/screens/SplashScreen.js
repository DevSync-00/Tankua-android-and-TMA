import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import TankuaLogo from '../components/auth/TankuaLogo';
import { COLORS } from '../config/theme';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TankuaLogo size={96} showName name="Tankua" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
});

export default SplashScreen;
