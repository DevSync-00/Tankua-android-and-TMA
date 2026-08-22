import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import TankuaLogo from '../components/auth/TankuaLogo';
import { authStyles, AUTH_COLORS } from '../components/auth/authTheme';
import { AUTH_COPY } from '../constants/authCopy';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import GoogleIcon from '../components/auth/GoogleIcon';

const TelegramIcon = ({ size = 28, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 640">
    <Path
      d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"
      fill={color}
    />
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useFeedback();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Onboarding');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Google Sign-In Failed',
        message: error.message || 'Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthScreenLayout onBack={handleBack}>
      <View style={styles.header}>
        <TankuaLogo markSize={104} />
      </View>

      <Text style={authStyles.title}>{AUTH_COPY.signInHeadline}</Text>
      <Text style={authStyles.subtitle}>{AUTH_COPY.signInSubheadline}</Text>

      <View style={styles.buttonWrap}>
        <TouchableOpacity
          style={[styles.googleButton, isGoogleLoading && styles.authButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading}
          activeOpacity={0.85}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#1F1F1F" />
          ) : (
            <>
              <GoogleIcon size={24} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.telegramButton}
          onPress={() => navigation.navigate('TelegramLogin')}
          activeOpacity={0.85}
        >
          <TelegramIcon size={28} color="#FFFFFF" />
          <Text style={styles.telegramButtonText}>Continue with Telegram</Text>
        </TouchableOpacity>
      </View>

      <Text style={authStyles.terms}>{AUTH_COPY.termsApply}</Text>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonWrap: {
    marginTop: 36,
    width: '100%',
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#229ED9',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    gap: 12,
    marginBottom: 14,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 17,
    fontWeight: '700',
  },
  authButtonDisabled: {
    opacity: 0.65,
  },
  telegramButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default LoginScreen;


