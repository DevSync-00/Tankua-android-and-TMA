import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import CountryPicker, { Flag } from 'react-native-country-picker-modal';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import TankuaLogo from '../components/auth/TankuaLogo';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { authStyles } from '../components/auth/authTheme';
import { AUTH_COPY } from '../constants/authCopy';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { sendOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('ET');
  const [callingCode, setCallingCode] = useState('251');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Onboarding');
    }
  };

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

  return (
    <AuthScreenLayout onBack={handleBack}>
      <View style={styles.header}>
        <TankuaLogo size={72} />
      </View>

      <Text style={authStyles.title}>{AUTH_COPY.signInHeadline}</Text>
      <Text style={authStyles.subtitle}>{AUTH_COPY.signInSubheadline}</Text>

      <View style={authStyles.phoneInput}>
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withEmoji
          onSelect={handleSelectCountry}
          containerButtonStyle={styles.flagContainer}
          renderFlagButton={({ countryCode: code, onOpen }) => (
            <Pressable onPress={onOpen} hitSlop={8}>
              <Flag countryCode={code} withEmoji flagSize={22} />
            </Pressable>
          )}
        />
        <View style={authStyles.phoneDivider} />
        <TextInput
          style={authStyles.phoneInputField}
          placeholder={AUTH_COPY.phonePlaceholder}
          placeholderTextColor="#9CA3AF"
          value={phoneNumber}
          onChangeText={(value) => setPhoneNumber(value.replace(/[^\d]/g, ''))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
        />
      </View>

      <View style={styles.buttonWrap}>
        <AuthPrimaryButton
          label={AUTH_COPY.signInButton}
          onPress={handleSendOTP}
          loading={loading}
        />
      </View>

      <Text style={authStyles.terms}>{AUTH_COPY.termsApply}</Text>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  flagContainer: {
    padding: 0,
  },
  buttonWrap: {
    marginTop: 24,
  },
});

export default LoginScreen;
