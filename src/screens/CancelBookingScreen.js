import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { canCancelBooking, cancelBooking } from '../services/bookingManagement';
import Button from '../components/Button';

const CancelBookingScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast, confirm, alert: customAlert } = useFeedback();

  const { booking } = route.params || {};
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    if (booking?.id) {
      canCancelBooking(booking.id).then((info) => {
        setCancellationInfo(info);
        setCheckingEligibility(false);
      });
    }
  }, [booking?.id]);
  const handleCancel = async () => {
    if (!cancellationInfo?.canCancel) {
      showToast({ type: 'warning', title: 'Cannot Cancel', message: cancellationInfo?.reason || 'This booking cannot be cancelled.' });
      return;
    }

    confirm({
      title: 'Confirm Cancellation',
      message: `Are you sure you want to cancel this booking?\n\n${cancellationInfo.refundInfo.message}`,
      confirmText: 'Yes, Cancel',
      cancelText: 'No, Keep Booking',
      variant: 'danger',
    }).then(async (ok) => {
      if (ok) {
        setLoading(true);
        try {
          const result = await cancelBooking(booking.id, user.id, reason.trim() || null);
          
          customAlert({
            title: 'Booking Cancelled',
            message: result.refundAmount > 0
              ? `Your booking has been cancelled. Refund of ${result.refundAmount} ETB will be processed within 3-5 business days.`
              : 'Your booking has been cancelled.',
            variant: 'info',
          }).then(() => navigation.navigate('MainTabs', { screen: 'Trips' }));
        } catch (error) {
          showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to cancel booking. Please try again.' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.title}>Cancel Booking</Text>
          <Text style={styles.subtitle}>
            Please review the cancellation policy before proceeding
          </Text>
        </View>

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip</Text>
            <Text style={styles.detailValue}>{booking.destination_name || booking.destinationName || 'Trip'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{booking.tripDate || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailValue}>{booking.seats}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>{booking.total_price} ETB</Text>
          </View>
        </View>

        {/* Refund Information */}
        {cancellationInfo?.canCancel && (
          <View style={[
            styles.refundCard,
            cancellationInfo.refundInfo.policy === 'full' && styles.refundCardFull,
            cancellationInfo.refundInfo.policy === 'partial' && styles.refundCardPartial,
            cancellationInfo.refundInfo.policy === 'none' && styles.refundCardNone,
          ]}>
            <View style={styles.refundHeader}>
              <Ionicons 
                name={
                  cancellationInfo.refundInfo.policy === 'full' ? 'checkmark-circle' :
                  cancellationInfo.refundInfo.policy === 'partial' ? 'alert-circle' :
                  'close-circle'
                }
                size={24}
                color={
                  cancellationInfo.refundInfo.policy === 'full' ? COLORS.success :
                  cancellationInfo.refundInfo.policy === 'partial' ? COLORS.warning :
                  COLORS.error
                }
              />
              <Text style={styles.refundTitle}>Refund Policy</Text>
            </View>
            <Text style={styles.refundAmount}>
              {cancellationInfo.refundInfo.refundPercentage}% Refund
            </Text>
            <Text style={styles.refundValue}>
              {cancellationInfo.refundInfo.refundAmount} ETB
            </Text>
            <Text style={styles.refundMessage}>
              {cancellationInfo.refundInfo.message}
            </Text>
          </View>
        )}

        {/* Cannot Cancel */}
        {!cancellationInfo?.canCancel && (
          <View style={styles.errorCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorMessage}>{cancellationInfo?.reason}</Text>
          </View>
        )}

        {/* Cancellation Reason */}
        {cancellationInfo?.canCancel && (
          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason for cancellation (optional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Tell us why you're cancelling..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              maxLength={300}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Policy Summary */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <View style={styles.policyItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.success} />
            <Text style={styles.policyText}>
              More than 48 hours before trip: 100% refund
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Ionicons name="remove" size={16} color={COLORS.warning} />
            <Text style={styles.policyText}>
              24-48 hours before trip: 50% refund
            </Text>
          </View>
          <View style={styles.policyItem}>
            <Ionicons name="close" size={16} color={COLORS.error} />
            <Text style={styles.policyText}>
              Less than 24 hours before trip: No refund
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Keep Booking"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.keepButton}
        />
        <Button
          title={loading ? 'Cancelling...' : 'Cancel Booking'}
          onPress={handleCancel}
          disabled={!cancellationInfo?.canCancel || loading}
          loading={loading}
          style={[styles.cancelButton, { backgroundColor: COLORS.error }]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.md,
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
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  refundCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
  },
  refundCardFull: {
    backgroundColor: `${COLORS.success}10`,
    borderLeftColor: COLORS.success,
  },
  refundCardPartial: {
    backgroundColor: `${COLORS.warning}10`,
    borderLeftColor: COLORS.warning,
  },
  refundCardNone: {
    backgroundColor: `${COLORS.error}10`,
    borderLeftColor: COLORS.error,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  refundTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  refundAmount: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  refundValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  refundMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorMessage: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
  },
  reasonSection: {
    marginBottom: SPACING.md,
  },
  reasonLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  reasonInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    minHeight: 100,
    ...SHADOWS.small,
  },
  policyCard: {
    backgroundColor: `${COLORS.secondary}05`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  policyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  policyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  keepButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
});

export default CancelBookingScreen;


