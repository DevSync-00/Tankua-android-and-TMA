import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from '../config/theme';
import { useFeedback } from '../contexts/FeedbackContext';

const WEEKEND_PLANNER_URL = 'https://www.tankua.co/weekend';

export default function WeekendPlannerLink({ style }) {
  const { showToast } = useFeedback();

  const openPlanner = async () => {
    try {
      await Linking.openURL(WEEKEND_PLANNER_URL);
    } catch {
      showToast({
        type: 'error',
        title: 'Could not open the weekend planner',
        message: 'Try again or visit tankua.co/weekend in your browser.',
      });
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel="Plan your weekend"
      accessibilityHint="Opens the Tankua planner in your browser"
      activeOpacity={0.85}
      onPress={openPlanner}
      style={[styles.link, style]}
    >
      <View style={styles.icon}>
        <Ionicons name="calendar-outline" size={22} color={COLORS.secondary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Plan your weekend</Text>
        <Text style={styles.subtitle}>Addis outings, events and group plans</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.secondary,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.backgroundTertiary,
    fontSize: FONTS.sizes.sm,
  },
});
