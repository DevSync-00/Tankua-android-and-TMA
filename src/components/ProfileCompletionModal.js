import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import ModernButton from './ModernButton';

const ProfileCompletionModal = ({
  visible,
  completionPercentage,
  missingFields = [],
  firstMissingField,
  onCompleteProfile,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View style={styles.modalCard}>
          {/* Top Indicator Handle */}
          <View style={styles.handle} />

          {/* Icon & Title */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Finish setting up your details to unlock seamless booking and emergency support on Tankua.
            </Text>
          </View>

          {/* Progress Bar Container */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Profile Completeness</Text>
              <Text style={styles.progressValue}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(completionPercentage, 10)}%` },
                ]}
              />
            </View>
          </View>

          {/* Missing Fields List */}
          {missingFields.length > 0 && (
            <View style={styles.missingContainer}>
              <Text style={styles.missingTitle}>Missing Information:</Text>
              <View style={styles.pillsContainer}>
                {missingFields.map((field) => (
                  <View key={field.key} style={styles.pill}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                    <Text style={styles.pillText}>{field.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* CTA Buttons */}
          <View style={styles.actionsContainer}>
            <ModernButton
              title="Complete Profile Now"
              onPress={() => onCompleteProfile(firstMissingField)}
              variant="primary"
              size="large"
              icon="arrow-forward-circle"
              iconPosition="right"
              fullWidth
            />
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.large,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  progressContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  progressValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.black,
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: COLORS.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  missingContainer: {
    marginBottom: SPACING.xl,
  },
  missingTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}10`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
  },
  pillText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.error,
    marginLeft: 4,
  },
  actionsContainer: {
    gap: SPACING.sm,
  },
  dismissButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: FONTS.weights.semibold,
  },
});

export default ProfileCompletionModal;
