import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const ModernPickupStationCard = ({ 
  station, 
  onPress, 
  selected = false,
  showDistance = true,
  showTime = true,
  showPrice = true,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
            <Ionicons 
              name="location" 
              size={22} 
              color={selected ? COLORS.white : COLORS.secondary} 
            />
          </View>
          <View style={styles.content}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{station.name}</Text>
              {station.isNearest && (
                <View style={styles.nearestBadge}>
                  <Text style={styles.nearestText}>Nearest</Text>
                </View>
              )}
            </View>
            <Text style={styles.city}>{station.city || station.address || 'Pickup Point'}</Text>
          </View>

          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
              {selected && <View style={styles.radioInner} />}
            </View>
          </View>
        </View>

        <View style={styles.details}>
          {showTime && station.pickupTime && (
            <View style={styles.detailPill}>
              <Ionicons name="time-outline" size={13} color={COLORS.secondary} />
              <Text style={styles.detailText}>{station.pickupTime}</Text>
            </View>
          )}
          {showDistance && station.distance && (
            <View style={styles.detailPill}>
              <Ionicons name="navigate-outline" size={13} color={COLORS.secondary} />
              <Text style={styles.detailText}>{station.distance} km</Text>
            </View>
          )}
          {showPrice && (
            <View style={[styles.detailPill, station.extraPrice > 0 ? styles.extraPricePill : styles.freePill]}>
              <Ionicons 
                name={station.extraPrice > 0 ? "cash-outline" : "checkmark-circle-outline"} 
                size={13} 
                color={station.extraPrice > 0 ? COLORS.iconSecondary : COLORS.success} 
              />
              <Text style={[styles.detailText, station.extraPrice > 0 ? styles.extraPriceText : styles.freeText]}>
                {station.extraPrice > 0 ? `+ETB ${station.extraPrice}` : 'Included'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  cardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  cardContent: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  nearestBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nearestText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  city: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  radioContainer: {
    marginLeft: SPACING.xs,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingTop: 4,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  extraPricePill: {
    backgroundColor: '#FEF3C7',
  },
  freePill: {
    backgroundColor: '#ECFDF5',
  },
  detailText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  extraPriceText: {
    color: COLORS.iconSecondary,
    fontWeight: '700',
  },
  freeText: {
    color: COLORS.success,
    fontWeight: '700',
  },
});

export default ModernPickupStationCard;
