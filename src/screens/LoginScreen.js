import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CountryPicker, { Flag } from 'react-native-country-picker-modal';
import Svg, { Path, Polygon } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

const PaperBoatLogo = ({ size }) => {
  const width = size;
  const height = size * 0.72;

  return (
    <Svg width={width} height={height} viewBox="0 0 120 86">
      <Polygon
        points="10,60 60,18 110,60 88,76 32,76"
        fill={COLORS.primary}
        stroke={COLORS.secondary}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <Polygon
        points="60,18 82,50 60,50 38,50"
        fill={COLORS.primaryLight}
        stroke={COLORS.secondary}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Path
        d="M32 76 L60 60 L88 76"
        fill="none"
        stroke={COLORS.secondary}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const Wave = ({ position, height }) => {
  const path =
    position === 'top'
      ? 'M0,78 C70,25 150,120 240,60 C300,20 345,60 375,30 L375,0 L0,0 Z'
      : 'M0,40 C70,90 160,0 240,60 C300,110 350,80 375,95 L375,120 L0,120 Z';

  return (
    <View
      pointerEvents="none"
      style={[styles.wave, position === 'top' ? styles.waveTop : styles.waveBottom, { height }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 375 120" preserveAspectRatio="none">
        <Path d={path} fill={COLORS.primary} />
      </Svg>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { sendOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('ET');
  const [callingCode, setCallingCode] = useState('251');

  const topWaveHeight = Math.max(90, Math.min(height * 0.18, 140));
  const bottomWaveHeightBase = Math.max(120, Math.min(height * 0.22, 170));
  const bottomWaveHeight = bottomWaveHeightBase + insets.bottom;

  const contentPaddingTop = insets.top + topWaveHeight * 0.45;
  const contentPaddingBottom = bottomWaveHeight * 0.5;
  const logoSize = Math.min(width * 0.26, 88);

  const handleSelectCountry = (country) => {
    setCountryCode(country.cca2);
    const nextCallingCode = Array.isArray(country.callingCode)
      ? country.callingCode[0]
      : country.callingCode;
    if (nextCallingCode) {
      setCallingCode(nextCallingCode);
    }
  };

  const formatPhoneNumber = (raw) => {
    const trimmed = raw.replace(/\s+/g, '');
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) return trimmed;
    const sanitized = trimmed.replace(/^0+/, '');
    return `+${callingCode}${sanitized}`;
  };

  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!formattedPhone || formattedPhone.length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(formattedPhone);
      const resolvedPhone = result?.phoneNumber || formattedPhone;
      navigation.navigate('OTPVerification', { phoneNumber: resolvedPhone });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPrimaryButton = (label, onPress) => (
    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Wave position="top" height={topWaveHeight} />
      <Wave position="bottom" height={bottomWaveHeight} />

      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View style={styles.mainContent}>
              <View style={styles.logoContainer}>
                <PaperBoatLogo size={logoSize} />
                <Text style={styles.brandName}>Tankua</Text>
              </View>

              <View style={styles.headlineContainer}>
                <Text style={styles.headline}>Sign in now</Text>
                <Text style={styles.subHeadline}>Please sign in to continue our app</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.phoneInput}>
                  <View style={styles.flagSection}>
                    <CountryPicker
                      countryCode={countryCode}
                      withFilter
                      withFlag
                      withEmoji
                      withCallingCode
                      onSelect={handleSelectCountry}
                      containerButtonStyle={styles.flagButtonContainer}
                      renderFlagButton={({ countryCode: code, onOpen }) => (
                        <Pressable style={styles.flagButton} onPress={onOpen}>
                          <Flag countryCode={code} withEmoji flagSize={24} />
                          <Ionicons name="chevron-down" size={14} color={COLORS.grayDark} />
                        </Pressable>
                      )}
                    />
                  </View>
                  <TextInput
                    style={styles.phoneInputField}
                    placeholder="Phone number"
                    placeholderTextColor={COLORS.grayLight}
                    value={phoneNumber}
                    onChangeText={(value) => setPhoneNumber(value.replace(/[^\d]/g, ''))}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                  />
                </View>

                {renderPrimaryButton('Sign In', handleSendOTP)}
              </View>
            </View>

            <Text style={styles.terms}>*Terms and conditions apply</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
  },
  waveTop: {
    top: 0,
  },
  waveBottom: {
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brandName: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '900',
    color: COLORS.secondary,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    letterSpacing: -0.5,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headline: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  subHeadline: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  flagSection: {
    paddingRight: SPACING.sm,
    marginRight: SPACING.sm,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    justifyContent: 'center',
  },
  flagButtonContainer: {
    padding: 0,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  phoneInputField: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    paddingVertical: 6,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  terms: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.grayLight,
    marginTop: SPACING.lg,
  },
});

export default LoginScreen;
