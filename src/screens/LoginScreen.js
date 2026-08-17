import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import TankuaLogo from '../components/auth/TankuaLogo';
import { authStyles, AUTH_COLORS } from '../components/auth/authTheme';
import { AUTH_COPY } from '../constants/authCopy';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { COLORS } from '../config/theme';

const TelegramIcon = ({ size = 28, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 640 640">
    <Path
      d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"
      fill={color}
    />
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const { sendOTP, verifyOTP, checkBypassCredentials, IS_SANDBOX_BUILD } = useAuth();
  const { showToast } = useFeedback();
  
  const [showReviewerLogin, setShowReviewerLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bypassToken, setBypassToken] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Onboarding');
    }
  };

  const handleReviewerLogin = async () => {
    if (!phoneNumber.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Please enter your reviewer phone number.' });
      return;
    }
    if (!bypassToken.trim()) {
      showToast({ type: 'warning', title: 'Validation Error', message: 'Please enter your verification token.' });
      return;
    }

    setIsLoggingIn(true);
    try {
      const isBypass = await checkBypassCredentials(phoneNumber, bypassToken);
      if (!isBypass) {
        throw new Error('Invalid reviewer credentials or unauthorized environment.');
      }

      await sendOTP(phoneNumber);
      await verifyOTP(phoneNumber, bypassToken);
    } catch (error) {
      showToast({ type: 'error', title: 'Authentication Failed', message: error.message || 'Verification failed. Check credentials.' });
    } finally {
      setIsLoggingIn(false);
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
          style={styles.telegramButton}
          onPress={() => navigation.navigate('TelegramLogin')}
          activeOpacity={0.85}
        >
          <TelegramIcon size={28} color="#FFFFFF" />
          <Text style={styles.telegramButtonText}>Continue with Telegram</Text>
        </TouchableOpacity>

        {IS_SANDBOX_BUILD && (
          <View style={styles.sandboxContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowReviewerLogin(!showReviewerLogin)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showReviewerLogin ? 'lock-open-outline' : 'lock-closed-outline'}
                size={18}
                color={COLORS.iconPrimary}
              />
              <Text style={styles.toggleButtonText}>
                {showReviewerLogin ? 'Hide Reviewer Access' : 'Sign in with Reviewer Credentials'}
              </Text>
            </TouchableOpacity>

            {showReviewerLogin && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Reviewer Sign-In</Text>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone number (e.g. +12025550199)"
                    placeholderTextColor={AUTH_COLORS.textMuted}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Bypass token or code"
                    placeholderTextColor={AUTH_COLORS.textMuted}
                    value={bypassToken}
                    onChangeText={setBypassToken}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.signInButton, isLoggingIn && styles.signInButtonDisabled]}
                  onPress={handleReviewerLogin}
                  disabled={isLoggingIn}
                  activeOpacity={0.85}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
                      <Text style={styles.signInButtonText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  telegramButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sandboxContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF1CC',
    borderWidth: 1,
    borderColor: '#FFE6A6',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
    marginTop: 14,
    gap: 12,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFE6A6',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1B1E28',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#D97706',
    gap: 8,
    marginTop: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginScreen;

