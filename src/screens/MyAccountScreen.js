import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import ModernButton from '../components/ModernButton';

const MyAccountScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    emergency_contact: user?.emergency_contact || '',
    location: user?.location || '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.phone_number) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    try {
      setLoading(true);
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (label, value, onChangeText, placeholder, icon, keyboardType = 'default', required = false, autoCapitalize = 'sentences') => {
    return (
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
        <View style={styles.inputWrapper}>
          {icon && (
            <View style={styles.inputIcon}>
              <Ionicons name={icon} size={20} color={COLORS.gray} />
            </View>
          )}
          <TextInput
            style={[styles.input, icon && styles.inputWithIcon]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.grayLight}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
        </View>
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
              true
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
              'Enter your email',
              'mail',
              'email-address',
              false,
              'none'
            )}
            {renderInputField(
              'Phone Number',
              formData.phone_number,
              (text) => setFormData({ ...formData, phone_number: text }),
              '+251 9XX XXX XXXX',
              'call',
              'phone-pad',
              true
            )}
            {renderInputField(
              'Emergency Contact',
              formData.emergency_contact,
              (text) => setFormData({ ...formData, emergency_contact: text }),
              'Emergency contact phone number',
              'call',
              'phone-pad',
              false
            )}
          </View>
        </View>

        {/* Location Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.sectionCard}>
            {renderInputField(
              'Address',
              formData.location,
              (text) => setFormData({ ...formData, location: text }),
              'Your location (city, address)',
              'location',
              'default',
              false
            )}
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Fields marked with * are required. Your information is kept secure and private.
          </Text>
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
