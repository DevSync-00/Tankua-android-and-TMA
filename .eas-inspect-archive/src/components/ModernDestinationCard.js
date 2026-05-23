import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

const ModernDestinationCard = ({
  destination,
  onPress,
  variant = 'grid',
  index = 0,
  reasonTag = '',
}) => {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = variant === 'grid' ? (width - SPACING.md * 3) / 2 : width - SPACING.md * 2;
  
  const {
    name,
    images = [],
    city = '',
    region = '',
    rating = 0,
    review_count = 0,
    price = 0,
    distance = 0,
    tags = [],
  } = destination;

  const imageUri = images && images.length > 0 ? images[0] : null;
  const hasImage = !!imageUri;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.listImageContainer}>
          {hasImage ? (
            <Image source={{ uri: imageUri }} style={styles.listImage} />
          ) : (
            <View style={styles.listImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.grayLight} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listTop}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {name}
            </Text>
            {price > 0 && (
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>R$ {price}</Text>
              </View>
            )}
          </View>

          <View style={styles.listLocation}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.listLocationText} numberOfLines={1}>
              {city || region}
            </Text>
          </View>

          {reasonTag && (
            <View style={styles.reasonTag}>
              <Text style={styles.reasonTagText}>{reasonTag}</Text>
            </View>
          )}

          <View style={styles.listFooter}>
            {rating > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)}
                  {review_count > 0 && (
                    <Text style={styles.reviewCount}> ({review_count})</Text>
                  )}
                </Text>
              </View>
            )}
            {distance > 0 && (
              <View style={styles.distanceContainer}>
                <Ionicons name="navigate-outline" size={14} color={COLORS.gray} />
                <Text style={styles.distanceText}>{distance}km</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.listArrow}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grayLight} />
        </View>
      </TouchableOpacity>
    );
  }

  // Grid variant (default)
  return (
    <TouchableOpacity
      style={[styles.gridCard, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {hasImage ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={COLORS.grayLight} />
          </View>
        )}
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.gradient}
        />

        {/* Price badge */}
        {price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>A partir de</Text>
            <Text style={styles.priceBadgeValue}>R$ {price}</Text>
          </View>
        )}

        {/* Reason tag */}
        {reasonTag && (
          <View style={styles.reasonBadge}>
            <Text style={styles.reasonBadgeText}>{reasonTag}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.location} numberOfLines={1}>
            {city || region}
          </Text>
        </View>

        <View style={styles.footer}>
          {rating > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {distance > 0 && (
            <View style={styles.distance}>
              <Ionicons name="navigate-outline" size={12} color={COLORS.gray} />
              <Text style={styles.distanceValue}>{distance}km</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid variant styles
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  priceBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.md,
  },
  priceBadgeText: {
    fontSize: 8,
    color: COLORS.white,
    fontWeight: FONTS.weights.semibold,
    textTransform: 'uppercase',
  },
  priceBadgeValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
  },
  reasonBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
  },
  reasonBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  location: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },

  // List variant styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  listImageContainer: {
    width: 100,
    height: 100,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  listTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  listTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  priceTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  priceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
  },
  listLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  listLocationText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
  reasonTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  reasonTagText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
  },
  reviewCount: {
    color: COLORS.gray,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  listArrow: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
});

export default ModernDestinationCard;
