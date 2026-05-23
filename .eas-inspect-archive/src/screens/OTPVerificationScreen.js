import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import TankuaLogo from '../components/auth/TankuaLogo';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import OtpDigitInput from '../components/auth/OtpDigitInput';
import { authStyles, AUTH_COLORS } from '../components/auth/authTheme';
import { AUTH_COPY } from '../constants/authCopy';
import { useAuth } from '../contexts/AuthContext';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { verifyOTP, sendOTP } = useAuth();
  const phoneNumber = route?.params?.phoneNumber || '';
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(86);

  useEffect(() => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Missing phone number');
      navigation.goBack();
    }
  }, [navigation, phoneNumber]);

  useEffect(() => {
    if (timerSeconds <= 0) return undefined;
    const interval = setInterval(() => {
      setTimerSeconds((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timerSeconds]);

  const otpValue = otpDigits.join('');
  const canResend = timerSeconds <= 0 && !loading;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(phoneNumber, otpValue);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await sendOTP(phoneNumber);
      setTimerSeconds(86);
      setOtpDigits(['', '', '', '', '', '']);
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

      <Text style={authStyles.title}>{AUTH_COPY.otpHeadline}</Text>
      <Text style={authStyles.subtitle}>{AUTH_COPY.otpSubheadline}</Text>

      <Text style={authStyles.fieldLabel}>{AUTH_COPY.otpLabel}</Text>
      <OtpDigitInput digits={otpDigits} onChangeDigits={setOtpDigits} />

      <View style={styles.buttonWrap}>
        <AuthPrimaryButton
          label={AUTH_COPY.verifyButton}
          onPress={handleVerify}
          loading={loading}
        />
      </View>

      <View style={styles.resendRow}>
        <Pressable onPress={handleResend} disabled={!canResend}>
          <Text style={[styles.resendText, canResend && styles.resendActive]}>
            {AUTH_COPY.resendCodeTo}
          </Text>
        </Pressable>
        <Text style={styles.timer}>{formattedTimer}</Text>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonWrap: {
    marginTop: 28,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  resendText: {
    fontSize: 14,
    color: AUTH_COLORS.textMuted,
    fontWeight: '500',
  },
  resendActive: {
    color: AUTH_COLORS.text,
  },
  timer: {
    fontSize: 14,
    fontWeight: '500',
    color: AUTH_COLORS.textMuted,
  },
});

export default OTPVerificationScreen;
