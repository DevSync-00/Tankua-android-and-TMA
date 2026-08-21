import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import ModernButton from '../components/ModernButton';
import { getCurrentCityLocation } from '../services/locationService';

const MyAccountScreen = ({ navigation, route }) => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { showToast, confirm } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const focusField = route && route.params ? route.params.focusField : null;
  const scrollRef = useRef(null);
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const emergencyContactInputRef = useRef(null);
  const cityInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    emergency_contact: user?.emergency_contact || '',
    city: user?.city || user?.location || '',
    location: user?.location || '',
  });

  useEffect(() => {
    if (focusField) {
      setTimeout(() => {
        if (focusField === 'name' && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (focusField === 'email' && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (focusField === 'emergency_contact' && emergencyContactInputRef.current) {
          emergencyContactInputRef.current.focus();
        } else if (focusField === 'city' && cityInputRef.current) {
          cityInputRef.current.focus();
        }
      }, 400);
    }
  }, [focusField]);

  const handleAutoDetectLocation = async () => {
    try {
      setDetectingLocation(true);
      const result = await getCurrentCityLocation();
      if (result.success && result.city) {
        setFormData((prev) => ({
          ...prev,
          city: result.city,
          location: result.formattedLocation || result.city,
        }));
        showToast({ type: 'success', title: 'Location Detected', message: `Updated city to "${result.city}".` });
      } else {
        showToast({ type: 'error', title: 'Location Detection Failed', message: result.error || 'Could not detect your current city.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to detect current location.' });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    const emailTrimmed = (formData.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isPlaceholderEmail = emailTrimmed.endsWith('@auth.tankua.app');

    if (!formData.name || !formData.phone_number || !emailTrimmed || isPlaceholderEmail || !formData.emergency_contact || !(formData.city || formData.location)) {
      showToast({ type: 'warning', title: 'Required Fields', message: 'Name, phone, valid email, emergency contact, and location are required.' });
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      showToast({ type: 'warning', title: 'Invalid Email', message: 'Please enter a valid email address.' });
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        ...formData,
        email: emailTrimmed,
      });
      showToast({ type: 'success', title: 'Success', message: 'Profile updated successfully' });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast({ type: 'error', title: 'Error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    confirm({
      title: 'Delete Account',
      message: 'This will permanently delete your Tankua account, profile, saved payment methods, bookings, rewards, reviews, and notification data. Are you sure?',
      confirmText: 'Delete Forever',
      cancelText: 'Cancel',
      variant: 'danger',
    }).then((ok) => {
      if (ok) performDeleteAccount();
    });
  };

  const performDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast({
        type: 'error',
        title: 'Delete Account Failed',
        message: error.message || 'We could not delete your account right now. Please try again or contact support.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const isTelegramUser =
    user?.provider === 'telegram' ||
    user?.telegram_id != null ||
    user?.phone_number?.startsWith('telegram:') ||
    user?.email?.endsWith('@auth.tankua.app');

  const renderInputField = (
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = 'default',
    required = false,
    autoCapitalize = 'sentences',
    disabled = false,
    disabledNotice = null,
    inputRef = null,
    rightElement = null
  ) => {
    return (
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
          {disabled && (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={12} color={COLORS.gray} />
              <Text style={styles.lockedBadgeText}>Locked</Text>
            </View>
          )}
        </View>
        <View style={styles.inputWrapper}>
          {icon && (
            <View style={styles.inputIcon}>
              <Ionicons name={icon} size={20} color={disabled ? COLORS.grayLight : COLORS.gray} />
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              icon && styles.inputWithIcon,
              rightElement && styles.inputWithRightElement,
              disabled && styles.disabledInput,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.grayLight}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={!disabled}
          />
          {rightElement && (
            <View style={styles.rightElementContainer}>
              {rightElement}
            </View>
          )}
        </View>
        {disabled && disabledNotice && (
          <Text style={styles.disabledNoticeText}>{disabledNotice}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={COLORS.primary} />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{formData.name || 'Your Name'}</Text>
          <Text style={styles.profileEmail}>{formData.email || 'your.email@example.com'}</Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.sectionCard}>
            {renderInputField(
              'Full Name',
              formData.name,
              (text) => setFormData({ ...formData, name: text }),
              'Enter your full name',
              'person',
              'default',
              true,
              'words',
              false,
              null,
              nameInputRef
            )}
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          <View style={styles.sectionCard}>
            {renderInputField(
              'Email Address',
              formData.email,
              (text) => setFormData({ ...formData, email: text }),
              'Enter your email address',
              'mail',
              'email-address',
              true,
              'none',
              false,
              null,
              emailInputRef
            )}
            {renderInputField(
              'Phone Number',
              formData.phone_number,
              (text) => setFormData({ ...formData, phone_number: text }),
              '+251 9XX XXX XXXX',
              'call',
              'phone-pad',
              true,
              'none',
              isTelegramUser,
              isTelegramUser
                ? 'Phone number is bound to your Telegram account and cannot be modified or removed.'
                : null
            )}
            {renderInputField(
              'Emergency Contact',
              formData.emergency_contact,
              (text) => setFormData({ ...formData, emergency_contact: text }),
              'Emergency contact phone number',
              'call',
              'phone-pad',
              true,
              'none',
              false,
              null,
              emergencyContactInputRef
            )}
          </View>
        </View>

        {/* Location Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Location & City</Text>
          </View>
          <View style={styles.sectionCard}>
            {renderInputField(
              'City / Region',
              formData.city,
              (text) => setFormData({ ...formData, city: text, location: text }),
              'Enter your city (e.g. Addis Ababa)',
              'location',
              'default',
              true,
              'words',
              false,
              null,
              cityInputRef
            )}

            <TouchableOpacity
              style={styles.gpsDetectBar}
              onPress={handleAutoDetectLocation}
              disabled={detectingLocation}
              activeOpacity={0.8}
            >
              {detectingLocation ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.gpsDetectBarText}>Detecting your location...</Text>
                </>
              ) : (
                <>
                  <View style={styles.gpsIconCircle}>
                    <Ionicons name="navigate" size={16} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.gpsDetectBarText}>Auto-detect location using GPS</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Fields marked with * are required. Your information is kept secure and private.
          </Text>
        </View>

        {/* Account Deletion Section */}
        <View style={styles.dangerSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={COLORS.error} />
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          </View>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerHeading}>Delete Account</Text>
            <Text style={styles.dangerText}>
              Permanently remove your account and related data from Tankua. You will lose access to your trips, tickets, saved payment methods, rewards, and profile.
            </Text>
            <ModernButton
              title="Delete Account"
              onPress={handleDeleteAccount}
              variant="danger"
              size="medium"
              loading={deleting}
              disabled={loading}
              fullWidth
              icon="trash-outline"
              style={styles.deleteButton}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer with Save Button */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <ModernButton
          title="Save Changes"
          onPress={handleSave}
          variant="primary"
          size="large"
          loading={loading}
          style={styles.saveButton}
          icon="checkmark-circle"
          iconPosition="right"
        />
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  profileName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  sectionHeaderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  detectLocationBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    marginLeft: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.secondary,
  },
  required: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs / 2,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gray}15`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  lockedBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.semibold,
    marginLeft: 2,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 52,
  },
  inputWithIcon: {
    paddingLeft: SPACING.xl + SPACING.md,
  },
  gpsDetectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    marginTop: SPACING.xs,
  },
  gpsIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  gpsDetectBarText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  disabledInput: {
    backgroundColor: `${COLORS.borderLight}80`,
    color: COLORS.gray,
    borderColor: COLORS.borderLight,
  },
  disabledNoticeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
  dangerSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  dangerTitle: {
    color: COLORS.error,
  },
  dangerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    ...SHADOWS.small,
  },
  dangerHeading: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  dangerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  saveButton: {
    width: '100%',
  },
});

export default MyAccountScreen;
