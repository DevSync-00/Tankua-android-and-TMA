import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { isChapaKeyConfigured } from '../../config/payment';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { generateTransactionRef, processPayment, verifyPayment, sanitizeEmailForChapa } from '../../services/payment';
import { createPaymentTransaction, updatePaymentTransaction } from '../../services/paymentService';
import {
  canPayForTrip,
  getBookingForPayment,
  getTimeRemaining,
  isBookingValid,
  verifyBookingBeforePayment,
} from '../../services/bookingService';
import { supabase } from '../../config/supabase';
import ModernButton from '../../components/ModernButton';
import PaymentWebView from '../../components/PaymentWebView';
import { formatTripPrice, getTripCurrency } from '../../utils/tripCurrency';

const PaymentScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { currentBooking, calculateTotalPrice, createBooking } = useBooking();
  const { user } = useAuth();
  const { showToast, confirm, alert: customAlert } = useFeedback();
  const paymentMethod = 'chapa';
  const bookingIdToPay = route.params?.bookingId;
  const tripId = currentBooking.trip?.id;
  const [initializing, setInitializing] = useState(true);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const submitting = useRef(false);
  const bookingRequest = useRef(null);
  const chapaReady = isChapaKeyConfigured();

  const canPay = !initializing && isBookingValid(booking);
  const canReserve = !initializing && !booking && trip?.status === 'upcoming';
  const deadline = booking?.payment_deadline;
  const bookingExpired = booking?.payment_status === 'pending' && Date.parse(deadline) <= Date.now();
  const awaitingActivation = booking?.payment_status === 'pending'
    && booking.status === 'confirmed' && booking.trip?.status === 'upcoming';
  const seats = booking?.seats ?? currentBooking.seats;
  const pickup = booking?.pickup_station ?? currentBooking.pickupStation;
  const pickupFee = Number(pickup?.extraPrice ?? pickup?.extra_price ?? 0);
  const price = booking ? {
    basePrice: booking.base_price ?? Number(booking.total_price) - Number(booking.service_fee),
    serviceFee: booking.service_fee ?? 0,
    total: booking.total_price,
  } : calculateTotalPrice();
  const totalPrice = price.total;
  const currency = getTripCurrency(booking?.currency ?? currentBooking.trip?.currency);

  const viewTrips = () => navigation.getParent()?.navigate('MainTabs', { screen: 'Trips' });

  const showBookingError = (error) => {
    if (error.code === 'PROFILE_INCOMPLETE') {
      confirm({
        title: 'Profile Incomplete',
        message: error.message,
        confirmText: 'Update Profile',
        cancelText: 'Cancel',
      }).then((ok) => {
        if (ok) navigation.navigate('MainTabs', { screen: 'Profile' });
      });
    } else {
      showToast({ type: 'error', title: 'Booking unavailable', message: error.message || 'Please try again.' });
    }
  };

  useEffect(() => {
    let isMounted = true;
    setInitializing(true);
    setBooking(null);
    setTrip(null);

    const initializeBooking = async () => {
      try {
        if (!user) return;
        if (!isMounted) return;

        if (bookingIdToPay) {
          const existingBooking = await getBookingForPayment(bookingIdToPay);
          if (isMounted) setBooking(existingBooking);
          return;
        }

        if (!tripId) throw new Error('Select a trip to continue.');
        const { data: latestTrip, error } = await supabase
          .from('trips')
          .select('status, departure_date')
          .eq('id', tripId)
          .single();
        if (error) throw error;
        if (!isMounted) return;

        if (canPayForTrip(latestTrip)) {
          const requestKey = user.id + ':' + tripId;
          if (bookingRequest.current?.key !== requestKey) {
            bookingRequest.current = { key: requestKey, result: createBooking(user.id, user) };
          }
          const newBooking = await bookingRequest.current.result;
          if (isMounted) setBooking(newBooking);
        } else if (latestTrip.status === 'upcoming' && Date.parse(latestTrip.departure_date) > Date.now()) {
          setTrip(latestTrip);
        } else {
          throw new Error('This trip is currently closed for booking.');
        }
      } catch (error) {
        if (isMounted) showBookingError(error);
      } finally {
        if (isMounted) setInitializing(false);
      }
    };

    initializeBooking();
    return () => { isMounted = false; };
  }, [bookingIdToPay, tripId, user?.id]);

  useEffect(() => {
    if (!deadline || !canPay) return;
    const update = () => setTimeRemaining(getTimeRemaining(deadline));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline, canPay]);

  const handleReservation = async () => {
    if (submitting.current || !canReserve) return;
    submitting.current = true;
    setLoading(true);
    try {
      const reservation = await createBooking(user.id, user);
      setBooking(reservation);
      showToast({
        type: 'success',
        title: 'Seats reserved',
        message: isBookingValid(reservation)
          ? 'You can complete payment in My Trips.'
          : 'You can pay from My Trips once the trip is active.',
      });
      viewTrips();
    } catch (error) {
      showBookingError(error);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (submitting.current || !canPay || !chapaReady) return;

    submitting.current = true;
    setLoading(true);

    try {
      const verification = await verifyBookingBeforePayment(booking.id);
      if (!verification.valid) {
        customAlert({
          title: 'Payment unavailable',
          message: verification.reason,
          variant: 'warning',
        }).then(viewTrips);
        return;
      }

      const { id: bookingId, total_price: amount } = verification.booking;
      const paymentCurrency = getTripCurrency(verification.booking.currency);
      const phoneNumber = user?.phone_number || user?.phoneNumber || '';
      const customerName = user?.name || 'Customer';
      const customerEmail = sanitizeEmailForChapa(user?.email, phoneNumber);
      const transactionRef = generateTransactionRef(bookingId);

      await createPaymentTransaction({
        bookingId,
        userId: user.id,
        amount,
        currency: paymentCurrency,
        paymentMethod,
        transactionRef,
      });

      const paymentResult = await processPayment(paymentMethod, {
        amount,
        currency: paymentCurrency,
        phoneNumber,
        bookingId,
        customerName,
        customerEmail,
        transactionRef,
      });

      if (paymentResult.success && paymentResult.checkoutUrl) {
        await updatePaymentTransaction(transactionRef, {
          checkout_url: paymentResult.checkoutUrl,
          external_ref: paymentResult.paymentId ?? null,
          status: 'processing',
        }).catch(() => {});

        setPendingPayment({ txRef: transactionRef, bookingId, amount, currency: paymentCurrency });
        setCheckoutUrl(paymentResult.checkoutUrl);
        setCheckoutVisible(true);
        return;
      }

      throw new Error(paymentResult.message || 'Failed to initiate payment');
    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = error.message || 'Failed to process payment. Please try again.';

      if (errorMessage.includes('API key') || errorMessage.includes('not configured')) {
        errorMessage = 'Payment gateway is not configured. Please contact support or use a different payment method.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Invalid')) {
        errorMessage = 'Payment gateway authentication failed. Please check your payment configuration.';
      }

      showToast({ type: 'error', title: 'Payment Error', message: errorMessage });
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = () => {
    setCheckoutVisible(false);
    if (pendingPayment) {
      verifyPaymentStatus(pendingPayment);
    }
  };

  const handleCheckoutCancel = () => {
    setCheckoutVisible(false);
    setLoading(false);
    setPaymentProcessing(false);
  };

  const verifyPaymentStatus = async (payment) => {
    const { txRef, bookingId, amount, currency: paymentCurrency } = payment;
    setLoading(true);
    setPaymentProcessing(true);
    try {
      const verificationResult = await verifyPayment(paymentMethod, txRef);

      if (verificationResult.success && verificationResult.verified) {
        const verified = verificationResult.paymentData;
        if (verified?.tx_ref !== txRef || verified?.currency !== paymentCurrency ||
            Number(verified?.amount) !== Number(amount)) {
          throw new Error('Chapa returned different payment details.');
        }

        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
          })
          .eq('id', bookingId)
          .eq('payment_status', 'pending');

        if (updateError) throw updateError;

        await updatePaymentTransaction(txRef, {
          status: 'success',
          verified_at: new Date().toISOString(),
          verified_by: 'api',
        }).catch(() => {});

        const { data: updatedBooking, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (fetchError) throw fetchError;

        setBooking(updatedBooking);
        setLoading(false);
        setPaymentProcessing(false);
        customAlert({
          title: 'Success',
          message: updatedBooking.status === 'cancelled' ? 'Payment verified and sent for refund review.' : 'Payment verified successfully!',
          variant: 'info',
        }).then(() => updatedBooking.status === 'cancelled' ? viewTrips() : navigation.navigate('Confirmation', { booking: updatedBooking }));
      } else {
        confirm({
          title: 'Payment Pending',
          message: 'Your payment is being processed. We will notify you once it is confirmed.',
          confirmText: 'Check Again',
          cancelText: 'OK',
          variant: 'info',
        }).then((checkAgain) => {
          if (checkAgain) {
            verifyPaymentStatus(payment);
          } else {
            setLoading(false);
            setPaymentProcessing(false);
            navigation.navigate('MainTabs', { screen: 'Trips' });
          }
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast({
        type: 'error',
        title: 'Verification Error',
        message: 'Unable to verify payment. Please contact support if payment was deducted.',
      });
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  // Step Progress Header
  const renderStepHeader = () => {
    const steps = [
      { key: 'trips', label: 'Trips' },
      { key: 'pickup', label: 'Pickup' },
      { key: 'seats', label: 'Seats' },
      { key: 'payment', label: canPay ? 'Payment' : 'Review' }
    ];
    return (
      <View style={stepStyles.progressContainer}>
        {steps.map((step, idx) => {
          const isActive = step.key === 'payment';
          const isCompleted = idx < 3;
          return (
            <React.Fragment key={step.key}>
              <View style={stepStyles.stepWrapper}>
                <View style={[
                  stepStyles.stepCircle,
                  isActive && stepStyles.stepCircleActive,
                  isCompleted && stepStyles.stepCircleCompleted
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  ) : (
                    <Text style={[
                      stepStyles.stepNumber,
                      isActive && stepStyles.stepNumberActive,
                    ]}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[
                  stepStyles.stepLabel,
                  isActive && stepStyles.stepLabelActive
                ]}>{step.label}</Text>
              </View>
              {idx < steps.length - 1 && (
                <View style={[
                  stepStyles.stepDivider,
                  isCompleted && stepStyles.stepDividerCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Back Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.customBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>
          {canPay ? t('payment') || 'Payment' : 'Review booking'}
        </Text>
        <View style={styles.customHeaderRight} />
      </View>

      {!bookingIdToPay && renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {initializing ? <ActivityIndicator color={COLORS.primary} /> : null}
        {canReserve || awaitingActivation ? (
          <View style={styles.deadlineCard}>
            <Text style={styles.deadlineTitle}>{canReserve ? 'Booking is open' : 'Seats reserved'}</Text>
            <Text style={styles.methodDescription}>
              Payment opens in My Trips once the provider activates this trip.
            </Text>
          </View>
        ) : null}
        {!initializing && !canPay && !canReserve && !awaitingActivation && !bookingExpired ? (
          <View style={styles.deadlineCard}>
            <Text style={styles.deadlineTitle}>
              {booking?.payment_status === 'paid' ? 'Payment complete' : 'Booking unavailable'}
            </Text>
          </View>
        ) : null}
        {/* Payment Timer Alert */}
        {canPay ? (
          <View style={[
            styles.deadlineCard,
            timeRemaining != null && timeRemaining.totalSeconds < 600 ? styles.deadlineCardUrgent : null
          ]}>
            <View style={styles.timerHeaderRow}>
              <View style={styles.timerHeaderLeft}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={timeRemaining?.totalSeconds < 600 ? COLORS.error : COLORS.secondary} 
                />
                <Text style={styles.deadlineTitle}>
                  {timeRemaining?.totalSeconds < 600 ? 'Complete Payment Immediately' : 'Reservation Held For:'}
                </Text>
              </View>
              {timeRemaining && !timeRemaining.isExpired ? (
                <View style={[styles.timerBadge, timeRemaining.totalSeconds < 600 && styles.timerBadgeUrgent]}>
                  <Text style={[styles.timerBadgeText, timeRemaining.totalSeconds < 600 && styles.timerBadgeTextUrgent]}>
                    {String(timeRemaining.hours).padStart(2, '0')}:
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {bookingExpired ? (
          <View style={styles.expiredCard}>
            <Ionicons name="close-circle-outline" size={22} color={COLORS.error} />
            <Text style={styles.expiredText}>
              Your booking reservation has expired. Please return to Home to choose another trip.
            </Text>
          </View>
        ) : null}

        {/* Digital Ticket Receipt Card */}
        {canPay || canReserve ? <View style={styles.summaryCard}>
          <View style={styles.receiptTopHeader}>
            <View style={styles.receiptBadgeIcon}>
              <Ionicons name="receipt-outline" size={16} color={COLORS.secondary} />
            </View>
            <Text style={styles.summaryTitle}>Booking summary</Text>
          </View>
          
          {(booking?.destination_name || currentBooking.destination?.name) ? (
            <View style={styles.routePillContainer}>
              <Text style={styles.routeText} numberOfLines={1}>
                {booking?.destination_name || currentBooking.destination.name}
              </Text>
              {pickup?.name ? (
                <Text style={styles.pickupPillText} numberOfLines={1}>
                  Pickup: {pickup.pickup_address || pickup.name}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.receiptRowsContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Ticket Price ({seats} {seats === 1 ? 'seat' : 'seats'})</Text>
              <Text style={styles.summaryValue}>{formatTripPrice(Number(price.basePrice) - pickupFee, currency)}</Text>
            </View>

            {pickupFee > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pickup Station Add-on</Text>
                <Text style={styles.summaryValue}>+ {formatTripPrice(pickupFee, currency)}</Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee (5%)</Text>
              <Text style={styles.summaryValue}>+ {formatTripPrice(price.serviceFee, currency)}</Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{canPay ? 'Total Due' : 'Trip Total'}</Text>
            <Text style={styles.totalValue}>{formatTripPrice(totalPrice, currency)}</Text>
          </View>
        </View> : null}

        {/* Chapa Payment Option Card */}
        {canPay ? <View style={styles.methodsContainer}>
          <Text style={styles.methodsHeaderTitle}>Payment Method</Text>
          <View style={styles.methodCard}>
            <View style={styles.chapaLogoBadge}>
              <Ionicons name="card-outline" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodName}>{t('chapa') || 'Chapa Pay'}</Text>
              <Text style={styles.methodDescription}>
                {currency === 'USD' ? 'US dollar checkout' : 'Instant online checkout via local providers'}
              </Text>

              {/* Supported Channel Badges */}
              {currency === 'ETB' && <View style={styles.channelsRow}>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Telebirr</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>CBE Birr</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Card</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Bank</Text></View>
              </View>}
            </View>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.secondary} />
          </View>

          <View style={styles.sslTrustBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.success} />
            <Text style={styles.sslTrustText}>256-Bit SSL Encrypted Payment</Text>
          </View>

          {!chapaReady ? (
            <View style={styles.configWarning}>
              <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
              <Text style={styles.configWarningText}>
                Chapa environment variables are missing. Please configure EXPO_PUBLIC_CHAPA_SECRET_KEY in your local .env file.
              </Text>
            </View>
          ) : null}
        </View> : null}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      {!initializing ? <View style={styles.footer}>
        {canPay || canReserve ? <View style={styles.footerSummary}>
          <Text style={styles.footerTotalLabel}>{canPay ? 'Total Due' : 'Trip Total'}</Text>
          <Text style={styles.footerTotalValue}>{formatTripPrice(totalPrice, currency)}</Text>
        </View> : null}
        <ModernButton
          title={canPay
            ? (paymentProcessing ? 'Verifying payment…' : 'Pay with Chapa')
            : (canReserve ? 'Reserve seats' : 'View My Trips')}
          onPress={canPay ? handlePayment : canReserve ? handleReservation : viewTrips}
          disabled={loading || checkoutVisible || (canPay && !chapaReady)}
          loading={loading}
          variant="primary"
          size="medium"
          icon={canPay ? 'lock-closed-outline' : 'calendar-outline'}
          iconPosition="left"
          style={styles.button}
        />
      </View> : null}

      <PaymentWebView
        visible={checkoutVisible}
        checkoutUrl={checkoutUrl}
        providerName="Chapa"
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        onError={(message) => {
          setCheckoutVisible(false);
          setLoading(false);
          setPaymentProcessing(false);
          showToast({ type: 'error', title: 'Payment Error', message: message || 'Could not complete checkout.' });
        }}
      />
    </SafeAreaView>
  );
};

const stepStyles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepNumber: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: COLORS.secondary,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.borderLight,
    maxWidth: 40,
    marginTop: -14,
  },
  stepDividerCompleted: {
    backgroundColor: COLORS.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  receiptTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  receiptBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  routePillContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  routeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  pickupPillText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
    marginTop: 2,
  },
  receiptRowsContainer: {
    gap: 6,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  dashedDivider: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    marginVertical: SPACING.sm,
    height: 0,
  },
  totalLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  methodsContainer: {
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  methodsHeaderTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  chapaLogoBadge: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.xs,
  },
  methodName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  methodDescription: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  channelBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sslTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  sslTrustText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
  },
  configWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  configWarningText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.xs,
    color: COLORS.iconSecondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  footerSummary: {
    flex: 1,
    marginRight: SPACING.md,
  },
  footerTotalLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footerTotalValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 2,
  },
  button: {
    minWidth: 150,
  },
  deadlineCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  deadlineCardUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.error,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  deadlineTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  timerBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  timerBadgeUrgent: {
    backgroundColor: COLORS.error,
  },
  timerBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  timerBadgeTextUrgent: {
    color: COLORS.white,
  },
  expiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  expiredText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    fontWeight: '700',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  customBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  customHeaderTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  customHeaderRight: {
    width: 36,
  },
});

export default PaymentScreen;
