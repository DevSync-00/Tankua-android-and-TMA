import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import TankuaLogo from '../components/auth/TankuaLogo';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import PhoneCountryInput from '../components/auth/PhoneCountryInput';
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
        <TankuaLogo markSize={104} />
      </View>

      <Text style={authStyles.title}>{AUTH_COPY.signInHeadline}</Text>
      <Text style={authStyles.subtitle}>{AUTH_COPY.signInSubheadline}</Text>

      <PhoneCountryInput
        countryCode={countryCode}
        callingCode={callingCode}
        onSelectCountry={handleSelectCountry}
        value={phoneNumber}
        onChangeText={(value) => setPhoneNumber(value.replace(/[^\d]/g, ''))}
        placeholder={AUTH_COPY.phonePlaceholder}
      />

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
    marginBottom: 4,
  },
  buttonWrap: {
    marginTop: 24,
  },
});

export default LoginScreen;
