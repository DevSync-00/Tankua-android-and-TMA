import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useFeedback } from '../contexts/FeedbackContext';
import { getCancellationQuote, cancelBooking } from '../services/bookingManagement';
import { formatTripPrice } from '../utils/tripCurrency';
import Button from '../components/Button';

const CancelBookingScreen = ({ navigation, route }) => {
  const { showToast, confirm, alert: customAlert } = useFeedback();
  const { booking } = route.params || {};
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  const loadQuote = () => {
    setQuoteError(null);
    setQuote(null);
    getCancellationQuote(booking.id)
      .then(setQuote)
      .catch((error) => setQuoteError(error?.message || 'Could not load the cancellation terms.'));
  };

  useEffect(() => {
    if (booking?.id) loadQuote();
  }, [booking?.id]);

  const canCancel = Boolean(quote?.can_cancel);
  const paid = Boolean(quote?.paid);
  const currency = quote?.currency || booking?.currency;
  const refund = Number(quote?.refund_amount || 0);
  const percent = Number(quote?.refund_percentage || 0);
  const policy = percent === 100 ? 'full' : percent > 0 ? 'partial' : 'none';
  const departure = booking?.trip?.departure_date || booking?.date;

  const handleCancel = async () => {
    if (!canCancel || loading) return;

    const ok = await confirm({
      title: paid ? 'Cancel this booking?' : 'Release your reservation?',
      message: paid
        ? (refund > 0
          ? `You'll get ${formatTripPrice(refund, currency)} back (${percent}%). Your seats go back on sale.`
          : 'This is within 24 hours of departure, so no refund applies. Your seats go back on sale.')
        : 'You have not paid, so nothing is charged. Your seats go back on sale.',
      confirmText: paid ? 'Cancel booking' : 'Release seats',
      cancelText: 'Keep booking',
      variant: 'danger',
    });
    if (!ok) return;

    setLoading(true);
    try {
      await cancelBooking(booking, reason);
      await customAlert({
        title: paid ? 'Booking cancelled' : 'Reservation released',
        message: paid && refund > 0
          ? `Your refund of ${formatTripPrice(refund, currency)} is being processed. We'll message you when it is sent.`
          : 'Your seats are back on sale for other travelers.',
        variant: 'info',
      });
      navigation.navigate('MainTabs', { screen: 'Trips' });
    } catch (error) {
      showToast({ type: 'error', title: 'Could not cancel', message: error?.message || 'Please try again.' });
      loadQuote();
    } finally {
      setLoading(false);
    }
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
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.title}>Cancel booking</Text>
          <Text style={styles.subtitle}>Check what you get back before you confirm.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trip</Text>
            <Text style={styles.detailValue}>{booking.destination_name || 'Trip'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>
              {departure
                ? new Date(departure).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa', dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailValue}>{booking.seats}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{paid ? 'Amount paid' : 'Total (unpaid)'}</Text>
            <Text style={styles.detailValue}>{formatTripPrice(booking.total_price, booking.currency)}</Text>
          </View>
        </View>

        {!quote && !quoteError && (
          <View style={styles.card}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}

        {quoteError && (
          <View style={styles.errorCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorMessage}>{quoteError}</Text>
          </View>
        )}

        {quote && canCancel && paid && (
          <View style={[
            styles.refundCard,
            policy === 'full' && styles.refundCardFull,
            policy === 'partial' && styles.refundCardPartial,
            policy === 'none' && styles.refundCardNone,
          ]}>
            <View style={styles.refundHeader}>
              <Ionicons
                name={policy === 'full' ? 'checkmark-circle' : policy === 'partial' ? 'alert-circle' : 'close-circle'}
                size={24}
                color={policy === 'full' ? COLORS.success : policy === 'partial' ? COLORS.warning : COLORS.error}
              />
              <Text style={styles.refundTitle}>Your refund</Text>
            </View>
            <Text style={styles.refundAmount}>{percent}% refund</Text>
            <Text style={styles.refundValue}>{formatTripPrice(refund, currency)}</Text>
            <Text style={styles.refundMessage}>
              {refund > 0
                ? 'Refunds are sent to you after review, usually within 3–5 business days.'
                : 'Departure is less than 24 hours away, so no refund applies.'}
            </Text>
          </View>
        )}

        {quote && canCancel && !paid && (
          <View style={styles.refundCard}>
            <Text style={styles.refundMessage}>
              You haven&apos;t paid yet, so nothing is charged. Releasing puts your seats back on sale.
            </Text>
          </View>
        )}

        {quote && !canCancel && (
          <View style={styles.errorCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.error} />
            <Text style={styles.errorMessage}>{quote.reason}</Text>
          </View>
        )}

        {quote && canCancel && paid && (
          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason for cancelling (optional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Tell us why you're cancelling…"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              maxLength={300}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
              accessibilityLabel="Reason for cancelling"
            />
          </View>
        )}

        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Cancellation policy</Text>
          <View style={styles.policyItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.success} />
            <Text style={styles.policyText}>48 hours or more before departure: 100% refund</Text>
          </View>
          <View style={styles.policyItem}>
            <Ionicons name="remove" size={16} color={COLORS.warning} />
            <Text style={styles.policyText}>24–48 hours before departure: 50% refund</Text>
          </View>
          <View style={styles.policyItem}>
            <Ionicons name="close" size={16} color={COLORS.error} />
            <Text style={styles.policyText}>Less than 24 hours before departure: no refund</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Keep booking"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.keepButton}
        />
        <Button
          title={loading ? 'Cancelling…' : paid ? 'Cancel booking' : 'Release seats'}
          onPress={handleCancel}
          disabled={!canCancel || loading}
          loading={loading}
          style={[styles.cancelButton, { backgroundColor: COLORS.error }]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
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


