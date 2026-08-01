import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { isFavorited as checkFavorited, toggleFavorite } from '../services/favorites';

import { getPlaceholderImage } from '../services/database';

/**
 * Destination card — two variants driven by `size`:
 *   'small'  → compact grid card (used in 2-col FlatList)
 *   'large'  → full-width feature card (used in horizontal lists / home)
 *
 * Width is always 100% of the parent cell; the caller controls cell width via
 * FlatList column layout. No internal width calculation needed.
 */
const EnhancedDestinationCard = ({ destination, onPress, size = 'small', style }) => {
  const [favorited, setFavorited] = useState(false);

  const {
    id, name, images = [], city = '', region = '',
    rating = 0, review_count = 0, price = null, distance = 0,
    estimated_duration = null,
    category = 'other',
  } = destination;

  const imageUri  = (images && images.length > 0)
    ? images[0]
    : getPlaceholderImage(id, name, category);
  const location  = city || region || '';
  const imgHeight = size === 'large' ? 220 : 100;

  useEffect(() => {
    if (id) checkFavorited(id).then(setFavorited);
  }, [id]);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!id) return;
    const next = await toggleFavorite(id);
    setFavorited(next);
  };

  const formatDuration = () => {
    if (!estimated_duration) return null;
    if (estimated_duration < 1) return `${Math.round(estimated_duration * 60)}m`;
    if (estimated_duration < 24) return `${Math.round(estimated_duration)}h`;
    return `${Math.round(estimated_duration / 24)}d`;
  };

  return (
    <TouchableOpacity style={[styles.card, size === 'small' && { height: 210 }, style]} onPress={onPress} activeOpacity={0.88}>
      {/* ── Image ── */}
      <View style={[styles.imgWrap, { height: imgHeight }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={styles.imgPlaceholder}>
            <Ionicons name="image-outline" size={36} color={COLORS.grayLight} />
          </View>
        )}

        {/* Gradient at bottom of image */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.imgGradient}
        />

        {/* Favourite button */}
        <TouchableOpacity style={styles.favBtn} onPress={handleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={18}
            color={favorited ? '#FF6B6B' : COLORS.white}
          />
        </TouchableOpacity>

        {/* Price badge pinned to bottom-left of image */}
        {typeof price === 'number' && price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>ETB {price.toLocaleString()}</Text>
          </View>
        )}
      </View>

      {/* ── Text content ── */}
      <View style={styles.body}>
        {/* Name + rating on the same row */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          {rating > 0 && (
            <View style={styles.ratingWrap}>
              <Ionicons name="star" size={11} color={COLORS.warning} />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Location */}
        {location ? (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.grayLight} />
            <Text style={styles.locText} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}

        {/* Meta pills */}
        <View style={styles.metaRow}>
          {formatDuration() && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={11} color={COLORS.gray} />
              <Text style={styles.metaText}>{formatDuration()}</Text>
            </View>
          )}
          {distance > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="navigate-outline" size={11} color={COLORS.gray} />
              <Text style={styles.metaText}>{distance} km</Text>
            </View>
          )}
          {review_count > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="chatbubble-outline" size={11} color={COLORS.gray} />
              <Text style={styles.metaText}>{review_count}</Text>
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
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },

  // Image
  imgWrap: {
    width: '100%',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  favBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.md,
  },
  priceText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.black,
    color: COLORS.white,
  },

  // Body
  body: {
    padding: SPACING.sm,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  name: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
    lineHeight: 18,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${COLORS.warning}18`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    flexShrink: 0,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: FONTS.weights.bold,
    color: COLORS.secondary,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 11,
    color: COLORS.grayLight,
    fontWeight: FONTS.weights.medium,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.backgroundGray,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: FONTS.weights.medium,
  },
});

export default EnhancedDestinationCard;
