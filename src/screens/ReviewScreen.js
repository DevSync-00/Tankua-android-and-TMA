import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import Button from '../components/Button';

const ReviewScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { booking } = route.params || {};

  const [rating, setRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select an overall rating');
      return;
    }

    if (!booking?.id) {
      Alert.alert('Error', 'Invalid booking information');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        booking_id: booking.id,
        user_id: user.id,
        provider_id: booking.providerId,
        trip_id: booking.tripId,
        rating,
        comment: comment.trim() || null,
        vehicle_rating: vehicleRating || null,
        driver_rating: driverRating || null,
        punctuality_rating: punctualityRating || null,
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Reviewed', 'You have already submitted a review for this trip.');
        } else {
          throw error;
        }
        return;
      }

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, size = 32, label }) => (
    <View style={styles.starRatingContainer}>
      {label && <Text style={styles.ratingLabel}>{label}</Text>}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={size}
              color={star <= value ? COLORS.primary : COLORS.gray}
            />
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Text style={styles.ratingValue}>
          {value === 5 ? 'Excellent' : 
           value === 4 ? 'Very Good' : 
           value === 3 ? 'Good' : 
           value === 2 ? 'Fair' : 'Poor'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate Your Trip</Text>
            <Text style={styles.subtitle}>
              Help other travelers by sharing your experience
            </Text>
          </View>

          {/* Trip Info */}
          {booking && (
            <View style={styles.tripCard}>
              <View style={styles.tripIconContainer}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripName}>{booking.destination_name || booking.destinationName || 'Trip'}</Text>
                <Text style={styles.tripDate}>
                  {booking.tripDate || 'Date not available'}
                </Text>
                {booking.providerName && (
                  <Text style={styles.tripProvider}>
                    Provider: {booking.providerName}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <StarRating value={rating} onChange={setRating} size={40} />
          </View>

          {/* Detailed Ratings Toggle */}
          <TouchableOpacity
            style={styles.detailedToggle}
            onPress={() => setShowDetailedRatings(!showDetailedRatings)}
          >
            <Text style={styles.detailedToggleText}>
              {showDetailedRatings ? 'Hide' : 'Show'} detailed ratings
            </Text>
            <Ionicons
              name={showDetailedRatings ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {/* Detailed Ratings */}
          {showDetailedRatings && (
            <View style={styles.detailedSection}>
              <StarRating
                value={vehicleRating}
                onChange={setVehicleRating}
                size={28}
                label="Vehicle Condition"
              />
              <StarRating
                value={driverRating}
                onChange={setDriverRating}
                size={28}
                label="Driver Service"
              />
              <StarRating
                value={punctualityRating}
                onChange={setPunctualityRating}
                size={28}
                label="Punctuality"
              />
            </View>
          )}

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience with other travelers..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={5}
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for a helpful review</Text>
              <Text style={styles.tipsText}>
                • Describe the vehicle condition and comfort{'\n'}
                • Mention the driver's professionalism{'\n'}
                • Comment on punctuality and pickup experience{'\n'}
                • Share what made your trip special
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Button
            title={loading ? 'Submitting...' : 'Submit Review'}
            onPress={handleSubmit}
            disabled={rating === 0 || loading}
            loading={loading}
            style={styles.button}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  tripCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  tripIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tripInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tripName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  tripDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  tripProvider: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  starRatingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ratingLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  detailedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailedToggleText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  detailedSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    minHeight: 120,
    ...SHADOWS.small,
  },
  charCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  tipsContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  tipsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    width: '100%',
  },
});

export default ReviewScreen;


