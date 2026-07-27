import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';
import { isChapaKeyConfigured } from '../../config/payment';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { processPayment, verifyPayment } from '../../services/payment';
import { verifyBookingBeforePayment, getTimeRemaining, checkAndCancelExpiredBookings } from '../../services/bookingService';
import { validateProfile, getProfileIncompleteMessage } from '../../utils/profileValidation';
import { supabase } from '../../config/supabase';
import ModernButton from '../../components/ModernButton';
import PaymentWebView from '../../components/PaymentWebView';

const PaymentScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { currentBooking, updateBooking, calculateTotalPrice, createBooking } = useBooking();
  const { user } = useAuth();
  const paymentMethod = 'chapa';
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [pendingTxRef, setPendingTxRef] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [bookingExpired, setBookingExpired] = useState(false);
  const intervalRef = useRef(null);
  const chapaReady = isChapaKeyConfigured();

  const price = calculateTotalPrice();
  const totalPrice = price.total;

  useEffect(() => {
    let isMounted = true;

    const initializeBooking = async () => {
      if (!user) return;

      try {
        await checkAndCancelExpiredBookings(user.id);

        if (!booking && isMounted) {
          const validation = validateProfile(user);
          if (!validation.isValid) {
            const error = new Error(getProfileIncompleteMessage(validation.missingFields));
            error.code = 'PROFILE_INCOMPLETE';
            throw error;
          }
          
          const newBooking = await createBooking(user.id, user);
          if (isMounted) {
            setBooking(newBooking);
            if (newBooking.payment_deadline) {
              updateTimer(newBooking.payment_deadline);
            }
          }
        } else if (booking?.payment_deadline && isMounted) {
          updateTimer(booking.payment_deadline);
        }
      } catch (error) {
        console.error('Error initializing booking:', error);
        if (isMounted) {
          if (error.code === 'PROFILE_INCOMPLETE') {
            Alert.alert(
              'Profile Incomplete',
              error.message,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
                { 
                  text: 'Update Profile', 
                  onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' })
                },
              ]
            );
          } else {
            Alert.alert('Error', error.message || 'Failed to create booking. Please try again.');
            navigation.goBack();
          }
        }
      }
    };

    initializeBooking();

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const updateTimer = (deadline) => {
    const update = () => {
      const remaining = getTimeRemaining(deadline);
      setTimeRemaining(remaining);
      
      if (remaining.isExpired) {
        setBookingExpired(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        handleBookingExpired();
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);
  };

  const handleBookingExpired = async () => {
    if (!booking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', booking.id);

      if (error) throw error;

      Alert.alert(
        'Booking Expired',
        'Your booking has been cancelled because payment was not completed within 2 hours. The seat has been released.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
          },
        ]
      );
    } catch (error) {
      console.error('Error cancelling expired booking:', error);
    }
  };

  const handlePayment = async () => {
    if (!chapaReady) {
      Alert.alert(
        'Payment Unavailable',
        'Chapa Pay is not configured. Add EXPO_PUBLIC_CHAPA_SECRET_KEY to .env and restart the app.'
      );
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    setPaymentProcessing(true);
    updateBooking({ paymentMethod });

    try {
      if (!booking || !booking.id) {
        setLoading(false);
        setPaymentProcessing(false);
        Alert.alert(
          'Booking Error',
          'Booking not found. Please try creating a new booking.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
            },
          ]
        );
        return;
      }

      const verification = await verifyBookingBeforePayment(booking.id);
      
      if (!verification.valid) {
        setLoading(false);
        setPaymentProcessing(false);
        Alert.alert(
          'Booking Invalid',
          verification.reason || 'This booking is no longer valid.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
            },
          ]
        );
        return;
      }

      const bookingId = booking.id;
      const priceObj = calculateTotalPrice();
      const phoneNumber = user?.phone_number || user?.phoneNumber || '';
      const customerName = user?.name || 'Customer';
      const customerEmail = user?.email || (phoneNumber ? `${phoneNumber}@tankua.app` : 'customer@tankua.app');

      const paymentData = {
        amount: priceObj.total,
        currency: 'ETB',
        phoneNumber: phoneNumber,
        bookingId: bookingId,
        customerName: customerName,
        customerEmail: customerEmail,
      };

      const paymentResult = await processPayment(paymentMethod, paymentData);

      if (paymentResult.success && paymentResult.checkoutUrl) {
        updateBooking({
          transactionRef: paymentResult.transactionRef,
          paymentId: paymentResult.paymentId,
        });

        setPendingTxRef(paymentResult.transactionRef);
        setPendingBookingId(bookingId);
        setCheckoutUrl(paymentResult.checkoutUrl);
        setCheckoutVisible(true);
        setLoading(false);
        setPaymentProcessing(false);
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
      
      Alert.alert(
        'Payment Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              setPaymentProcessing(false);
            },
          },
        ]
      );
    }
  };

  const handleCheckoutSuccess = () => {
    setCheckoutVisible(false);
    if (pendingTxRef && pendingBookingId) {
      verifyPaymentStatus(pendingTxRef, pendingBookingId);
    }
  };

  const handleCheckoutCancel = () => {
    setCheckoutVisible(false);
    setLoading(false);
    setPaymentProcessing(false);
  };

  const verifyPaymentStatus = async (txRef, bookingId) => {
    setLoading(true);
    setPaymentProcessing(true);
    try {
      const verificationResult = await verifyPayment(paymentMethod, txRef);

      if (verificationResult.success && verificationResult.verified) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        const { data: updatedBooking, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (fetchError) throw fetchError;

        setLoading(false);
        setPaymentProcessing(false);
        Alert.alert('Success', 'Payment verified successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Confirmation', { booking: updatedBooking }),
          },
        ]);
      } else {
        Alert.alert(
          'Payment Pending',
          'Your payment is being processed. We will notify you once it is confirmed.',
          [
            {
              text: 'Check Again',
              onPress: () => verifyPaymentStatus(txRef, bookingId),
            },
            {
              text: 'OK',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                setPaymentProcessing(false);
                navigation.navigate('MainTabs', { screen: 'Trips' });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Error',
        'Unable to verify payment. Please contact support if payment was deducted.',
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              setPaymentProcessing(false);
            },
          },
        ]
      );
    }
  };

  // Step Progress Header
  const renderStepHeader = () => {
    const steps = [
      { key: 'trips', label: 'Trips' },
      { key: 'pickup', label: 'Pickup' },
      { key: 'seats', label: 'Seats' },
      { key: 'payment', label: 'Payment' }
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
        <Text style={styles.customHeaderTitle}>{t('payment') || 'Payment'}</Text>
        <View style={styles.customHeaderRight} />
      </View>

      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Timer Alert */}
        {booking?.payment_deadline && !bookingExpired ? (
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
        <View style={styles.summaryCard}>
          <View style={styles.receiptTopHeader}>
            <View style={styles.receiptBadgeIcon}>
              <Ionicons name="receipt-outline" size={16} color={COLORS.secondary} />
            </View>
            <Text style={styles.summaryTitle}>Trip Booking Receipt</Text>
          </View>
          
          {currentBooking.trip ? (
            <View style={styles.routePillContainer}>
              <Text style={styles.routeText} numberOfLines={1}>
                {currentBooking.trip.origin || 'Origin'} → {currentBooking.trip.destination || 'Destination'}
              </Text>
              {currentBooking.pickupStation?.name ? (
                <Text style={styles.pickupPillText} numberOfLines={1}>
                  Pickup: {currentBooking.pickupStation.name}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.receiptRowsContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Ticket Price ({currentBooking.seats || 1} Seat)</Text>
              <Text style={styles.summaryValue}>ETB {price.basePrice * (currentBooking.seats || 1)}</Text>
            </View>

            {Number(currentBooking.pickupStation?.extraPrice) > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pickup Station Add-on</Text>
                <Text style={styles.summaryValue}>+ ETB {currentBooking.pickupStation.extraPrice}</Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee (5%)</Text>
              <Text style={styles.summaryValue}>+ ETB {price.serviceFee}</Text>
            </View>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>ETB {totalPrice}</Text>
          </View>
        </View>

        {/* Chapa Payment Option Card */}
        <View style={styles.methodsContainer}>
          <Text style={styles.methodsHeaderTitle}>Payment Method</Text>
          <View style={styles.methodCard}>
            <View style={styles.chapaLogoBadge}>
              <Ionicons name="card-outline" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodName}>{t('chapa') || 'Chapa Pay'}</Text>
              <Text style={styles.methodDescription}>
                Instant online checkout via local providers
              </Text>

              {/* Supported Channel Badges */}
              <View style={styles.channelsRow}>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Telebirr</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>CBE Birr</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Card</Text></View>
                <View style={styles.channelBadge}><Text style={styles.channelBadgeText}>Bank</Text></View>
              </View>
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
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerTotalLabel}>Total Due</Text>
          <Text style={styles.footerTotalValue}>ETB {totalPrice}</Text>
        </View>
        <ModernButton
          title={
            bookingExpired
              ? 'Expired'
              : loading
                ? paymentProcessing
                  ? 'Verifying...'
                  : 'Opening Chapa...'
                : 'Pay with Chapa'
          }
          onPress={handlePayment}
          disabled={!chapaReady || loading || bookingExpired}
          loading={loading}
          variant="primary"
          size="medium"
          icon="lock-closed-outline"
          iconPosition="left"
          style={styles.button}
        />
      </View>

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
          Alert.alert('Payment Error', message || 'Could not complete checkout.');
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
