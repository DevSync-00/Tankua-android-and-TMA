import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

/**
 * ReviewCard - Display a single review
 */
const ReviewCard = ({
  review,
  showProviderResponse = true,
  onHelpful,
  userVoted = false,
}) => {
  const {
    rating,
    comment,
    user_name,
    created_at,
    helpful_count = 0,
    provider_response,
    provider_response_at,
    vehicle_rating,
    driver_rating,
    punctuality_rating,
  } = review;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const renderStars = (count) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= count ? 'star' : 'star-outline'}
            size={16}
            color={star <= count ? COLORS.primary : COLORS.lightGray}
          />
        ))}
      </View>
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user_name)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user_name || 'Anonymous'}</Text>
          <Text style={styles.date}>{formatDate(created_at)}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{rating}</Text>
          <Ionicons name="star" size={14} color={COLORS.white} />
        </View>
      </View>

      {/* Stars */}
      <View style={styles.starsRow}>
        {renderStars(rating)}
      </View>

      {/* Comment */}
      {comment && <Text style={styles.comment}>{comment}</Text>}

      {/* Detailed Ratings */}
      {(vehicle_rating || driver_rating || punctuality_rating) && (
        <View style={styles.detailedRatings}>
          {vehicle_rating && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedLabel}>Vehicle</Text>
              {renderStars(vehicle_rating)}
            </View>
          )}
          {driver_rating && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedLabel}>Driver</Text>
              {renderStars(driver_rating)}
            </View>
          )}
          {punctuality_rating && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedLabel}>Punctuality</Text>
              {renderStars(punctuality_rating)}
            </View>
          )}
        </View>
      )}

      {/* Provider Response */}
      {showProviderResponse && provider_response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Ionicons name="business" size={16} color={COLORS.primary} />
            <Text style={styles.responseLabel}>Provider Response</Text>
            <Text style={styles.responseDate}>
              {formatDate(provider_response_at)}
            </Text>
          </View>
          <Text style={styles.responseText}>{provider_response}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.helpfulButton, userVoted && styles.helpfulButtonVoted]}
          onPress={onHelpful}
          disabled={userVoted}
        >
          <Ionicons
            name={userVoted ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={userVoted ? COLORS.primary : COLORS.gray}
          />
          <Text
            style={[styles.helpfulText, userVoted && styles.helpfulTextVoted]}
          >
            Helpful {helpful_count > 0 && `(${helpful_count})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  date: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  starsRow: {
    marginBottom: SPACING.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  detailedRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  detailedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailedLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  responseContainer: {
    backgroundColor: `${COLORS.primary}08`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  responseLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  responseDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
  },
  responseText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  helpfulButtonVoted: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.sm,
  },
  helpfulText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  helpfulTextVoted: {
    color: COLORS.primary,
  },
});

export default ReviewCard;


