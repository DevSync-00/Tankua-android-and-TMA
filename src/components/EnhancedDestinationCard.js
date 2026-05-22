import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

/** Compact home-grid card — fixed size so nothing stretches. */
export const HOME_GRID_CARD = {
  maxWidth: 200,
  imageHeight: 170,
  bodyHeight: 90,
  radius: 36,
  get height() {
    return this.imageHeight + this.bodyHeight;
  },
};

const EnhancedDestinationCard = ({
  destination,
  onPress,
  size = 'medium',
  index = 0,
  containerWidth,
  cardWidth: cardWidthProp,
}) => {
  const windowDimensions = useWindowDimensions();

  const screenWidth = useMemo(() => {
    if (containerWidth && typeof containerWidth === 'number' && containerWidth > 0) {
      return containerWidth;
    }

    const wdWidth = windowDimensions?.width;
    if (wdWidth && typeof wdWidth === 'number' && wdWidth > 0) {
      return wdWidth;
    }

    try {
      const dims = Dimensions.get('window');
      if (dims?.width > 0) return dims.width;
    } catch {
      // fall through
    }

    return 375;
  }, [containerWidth, windowDimensions]);

  const gridCardWidth = useMemo(() => {
    const fullColumn = (screenWidth - SPACING.md * 3) / 2;
    const base = cardWidthProp && cardWidthProp > 0 ? cardWidthProp : fullColumn;
    return Math.min(base, HOME_GRID_CARD.maxWidth);
  }, [cardWidthProp, screenWidth]);

  const {
    name,
    images = [],
    city = '',
    region = '',
    rating = 0,
    review_count = 0,
    price = null,
    distance = 0,
    estimated_duration = null,
    price_range = null,
  } = destination;

  const imageUri = images?.length > 0 ? images[0] : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${name} in ${city || region}!`,
        title: name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatPriceRange = () => {
    if (!price_range) return null;
    if (typeof price_range === 'string') return price_range;
    if (price_range.min && price_range.max) {
      return `$${price_range.min}-${price_range.max}`;
    }
    return null;
  };

  const formatDuration = () => {
    if (!estimated_duration) return null;
    if (estimated_duration < 1) {
      return `${Math.round(estimated_duration * 60)}min`;
    }
    if (estimated_duration < 24) {
      return `${Math.round(estimated_duration)}h`;
    }
    return `${Math.round(estimated_duration / 24)}d`;
  };

  if (size === 'small') {
    const cardRadius = HOME_GRID_CARD.radius;

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            width: gridCardWidth,
            height: HOME_GRID_CARD.height,
            borderRadius: cardRadius,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View
          style={[
            styles.gridImageWrap,
            {
              height: HOME_GRID_CARD.imageHeight,
              borderTopLeftRadius: cardRadius,
              borderTopRightRadius: cardRadius,
            },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.gridImage} resizeMode="cover" />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Ionicons name="image-outline" size={36} color={COLORS.grayLight} />
            </View>
          )}

          <View style={styles.gridActions}>
            <TouchableOpacity
              style={styles.gridActionBtn}
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.gridBody,
            {
              height: HOME_GRID_CARD.bodyHeight,
              borderBottomLeftRadius: cardRadius,
              borderBottomRightRadius: cardRadius,
            },
          ]}
        >
          <Text style={styles.gridTitle} numberOfLines={2}>
            {name}
          </Text>

          <View style={styles.gridMetaRow}>
            {rating > 0 ? (
              <View style={styles.gridRating}>
                <Ionicons name="star" size={13} color={COLORS.warning} />
                <Text style={styles.gridRatingText}>{rating.toFixed(1)}</Text>
                {review_count > 0 ? (
                  <Text style={styles.gridReviewCount}>({review_count})</Text>
                ) : null}
              </View>
            ) : (
              <View />
            )}
          </View>

          <View style={styles.gridLocationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.gray} />
            <Text style={styles.gridLocation} numberOfLines={1}>
              {city || region || 'Ethiopia'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const getCardDimensions = () => {
    const safeWidth = screenWidth > 0 ? screenWidth : 375;
    const availableWidth = safeWidth - SPACING.md * 2;

    if (size === 'large') {
      return {
        width: availableWidth,
        height: 320,
        imageHeight: 240,
      };
    }

    return {
      width: (availableWidth * 2) / 3 - SPACING.md / 2,
      height: 300,
      imageHeight: 220,
    };
  };

  const dimensions = getCardDimensions();

  return (
    <TouchableOpacity
      style={[styles.card, { width: dimensions.width, height: dimensions.height }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.image, { height: dimensions.imageHeight }]} />
        ) : (
          <View style={[styles.imagePlaceholder, { height: dimensions.imageHeight }]}>
            <Ionicons name="image-outline" size={48} color={COLORS.grayLight} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {price ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>ETB {price}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerTop}>
            <Text style={styles.title} numberOfLines={2}>
              {name}
            </Text>
            {rating > 0 ? (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={[styles.ratingText, { marginLeft: 4 }]}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={[styles.location, { marginLeft: 4 }]} numberOfLines={1}>
              {city || region}
            </Text>
          </View>

          <View style={styles.metadataRow}>
            {formatDuration() ? (
              <View style={styles.metadataBadge}>
                <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                <Text style={[styles.metadataText, { marginLeft: 4 }]}>{formatDuration()}</Text>
              </View>
            ) : null}
            {formatPriceRange() ? (
              <View style={styles.metadataBadge}>
                <Ionicons name="cash-outline" size={12} color={COLORS.gray} />
                <Text style={[styles.metadataText, { marginLeft: 4 }]}>{formatPriceRange()}</Text>
              </View>
            ) : null}
            {distance > 0 ? (
              <View style={styles.metadataBadge}>
                <Ionicons name="navigate-outline" size={12} color={COLORS.gray} />
                <Text style={[styles.metadataText, { marginLeft: 4 }]}>{distance}km</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignSelf: 'center',
    ...SHADOWS.small,
  },
  gridImageWrap: {
    width: '100%',
    backgroundColor: COLORS.backgroundGray,
    position: 'relative',
    overflow: 'hidden',
  },
  gridImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundGray,
  },
  gridActions: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  gridActionBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBody: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    lineHeight: 18,
    height: 36,
    marginBottom: 2,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minHeight: 18,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridRatingText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  gridReviewCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    marginLeft: 2,
  },
  gridLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridLocation: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  actionButtons: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  priceLabel: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.black,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    ...SHADOWS.small,
    height: 80,
  },
  footerContent: {
    padding: SPACING.md,
    height: '100%',
    justifyContent: 'flex-start',
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
    height: 40,
  },
  title: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.black,
    color: COLORS.secondary,
    marginRight: SPACING.sm,
    lineHeight: 20,
    height: 40,
    overflow: 'hidden',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: FONTS.weights.bold,
  },
  reviewCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    height: 18,
  },
  location: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 24,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  metadataText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
});

export default EnhancedDestinationCard;
