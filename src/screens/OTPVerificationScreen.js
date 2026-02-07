import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OTPTextInput from 'react-native-otp-textinput';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

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

const OTPVerificationScreen = ({ navigation, route }) => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { verifyOTP, sendOTP } = useAuth();
  const otpInputRef = useRef(null);
  const phoneNumber = route?.params?.phoneNumber || '';
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(86);

  const topWaveHeight = Math.max(90, Math.min(height * 0.18, 140));
  const bottomWaveHeightBase = Math.max(120, Math.min(height * 0.22, 170));
  const bottomWaveHeight = bottomWaveHeightBase + insets.bottom;

  const contentPaddingTop = insets.top + topWaveHeight * 0.55;
  const contentPaddingBottom = bottomWaveHeight * 0.5;

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
    if (loading || timerSeconds > 0) return;
    if (!phoneNumber) {
      Alert.alert('Error', 'Missing phone number');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(phoneNumber);
      setTimerSeconds(86);
      otpInputRef.current?.clear();
      setOtpValue('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Wave position="top" height={topWaveHeight} />
      <Wave position="bottom" height={bottomWaveHeight} />

      <View style={[styles.fakeStatusBar, { top: Math.max(insets.top * 0.4, 6) }]}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={14} color={COLORS.secondary} />
          <Ionicons name="wifi" size={14} color={COLORS.secondary} />
          <Ionicons name="battery-full" size={16} color={COLORS.secondary} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={20} color={COLORS.secondary} />
      </TouchableOpacity>

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
            <View style={styles.content}>
              <Text style={styles.headline}>OTP Verification</Text>
              <Text style={styles.subHeadline}>
                Please check your SMS to see the verification code
              </Text>

              <View style={styles.otpSection}>
                <Text style={styles.otpLabel}>OTP Code</Text>
                <OTPTextInput
                  ref={otpInputRef}
                  inputCount={6}
                  inputCellLength={1}
                  keyboardType="number-pad"
                  autoFocus
                  tintColor={COLORS.primary}
                  offTintColor="#F5F5F5"
                  containerStyle={styles.otpContainer}
                  textInputStyle={styles.otpInput}
                  handleTextChange={setOtpValue}
                  textContentType="oneTimeCode"
                  selectionColor={COLORS.primary}
                />
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <TouchableOpacity onPress={handleResend} disabled={timerSeconds > 0 || loading}>
                  <Text
                    style={[
                      styles.resendText,
                      timerSeconds === 0 && !loading ? styles.resendTextActive : null,
                    ]}
                  >
                    Resend code to
                  </Text>
                </TouchableOpacity>
                <Text style={styles.resendText}>{formattedTimer}</Text>
              </View>
            </View>
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
  fakeStatusBar: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTime: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F1F1',
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
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  headline: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  subHeadline: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    textAlign: 'center',
  },
  otpSection: {
    width: '100%',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  otpContainer: {
    width: '100%',
    justifyContent: 'space-between',
  },
  otpInput: {
    width: 46,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 0,
    borderBottomWidth: 0,
    marginHorizontal: 4,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  verifyButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  resendRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.grayLight,
  },
  resendTextActive: {
    color: COLORS.gray,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
