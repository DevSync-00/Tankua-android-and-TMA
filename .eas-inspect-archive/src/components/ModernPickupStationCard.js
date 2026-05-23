import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, ANIMATIONS } from '../config/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ModernPickupStationCard = ({ 
  station, 
  onPress, 
  selected = false,
  index = 0,
  showDistance = true,
  showTime = true,
  showPrice = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, ANIMATIONS.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATIONS.spring);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.card,
        selected && styles.cardSelected,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
            <Ionicons 
              name="location" 
              size={24} 
              color={selected ? COLORS.white : COLORS.primary} 
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
            <Text style={styles.city}>{station.city}</Text>
          </View>
          {selected && (
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.details}>
          {showTime && station.pickupTime && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.detailText}>{station.pickupTime}</Text>
            </View>
          )}
          {showDistance && station.distance && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.detailText}>{station.distance} km</Text>
            </View>
          )}
          {showPrice && (
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons 
                  name={station.extraPrice > 0 ? "cash" : "checkmark-circle"} 
                  size={14} 
                  color={station.extraPrice > 0 ? COLORS.primary : COLORS.success} 
                />
              </View>
              <Text style={[
                styles.detailText,
                station.extraPrice > 0 && styles.priceText
              ]}>
                {station.extraPrice > 0 ? `+${station.extraPrice} ETB` : 'Free'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}15`,
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
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: -0.3,
  },
  nearestBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  nearestText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  city: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  checkContainer: {
    marginLeft: SPACING.sm,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  priceText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default ModernPickupStationCard;
