import { Platform, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../config/theme';

export const AUTH_COLORS = {
  text: '#1B1E28',
  textMuted: '#7D848D',
  dotInactive: '#CAEAFF',
  inputBackground: '#F7F7F9',
  backButtonBg: '#F7F7F9',
  skipOverlay: 'rgba(255, 255, 255, 0.92)',
};

export const AUTH_LAYOUT = {
  screenPadding: 20,
  heroRadius: 32,
  buttonHeight: 56,
  inputHeight: 56,
  otpSize: 46,
};

export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AUTH_COLORS.backButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AUTH_LAYOUT.screenPadding,
  },
  title: {
    fontSize: 22,
    fontWeight: FONTS.weights.bold,
    color: AUTH_COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: AUTH_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  primaryButton: {
    width: '100%',
    height: AUTH_LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: FONTS.weights.bold,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: AUTH_LAYOUT.inputHeight,
    backgroundColor: AUTH_COLORS.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: SPACING.xl,
  },
  phoneDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  phoneInputField: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text,
    paddingVertical: 0,
  },
  brandName: {
    marginTop: SPACING.sm,
    fontWeight: FONTS.weights.bold,
    color: AUTH_COLORS.text,
    fontFamily: SERIF_FONT,
    letterSpacing: -0.5,
  },
  terms: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: AUTH_COLORS.textMuted,
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  fieldLabel: {
    marginTop: SPACING.xl,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: AUTH_COLORS.text,
    textAlign: 'center',
  },
});
