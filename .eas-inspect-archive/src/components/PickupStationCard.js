import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const PickupStationCard = ({ 
  station, 
  onPress, 
  selected = false,
  showDistance = true,
  showTime = true,
  showPrice = true,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{station.name}</Text>
          <Text style={styles.city}>{station.city}</Text>
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
        )}
      </View>

      <View style={styles.details}>
        {showTime && station.pickupTime && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{station.pickupTime}</Text>
          </View>
        )}
        {showDistance && station.distance && (
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{station.distance} km</Text>
          </View>
        )}
        {showPrice && station.extraPrice > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.detailText, styles.priceText]}>
              +{station.extraPrice} ETB
            </Text>
          </View>
        )}
      </View>

      {station.isNearest && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nearest</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  city: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  priceText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default PickupStationCard;

