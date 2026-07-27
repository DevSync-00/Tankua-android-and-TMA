import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
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
      {renderStepHeader()}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Timer Alert */}
        {booking?.payment_deadline && !bookingExpired ? (
          <View style={[
            styles.deadlineCard,
            timeRemaining != null && timeRemaining.totalSeconds < 600 ? styles.deadlineCardUrgent : null
          ]}>
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={timeRemaining?.totalSeconds < 600 ? COLORS.error : COLORS.iconSecondary} 
            />
            <View style={styles.deadlineContent}>
              <Text style={styles.deadlineTitle}>
                {timeRemaining?.totalSeconds < 600 ? 'Complete Payment Immediately!' : 'Payment Window Closes In:'}
              </Text>
              {timeRemaining && !timeRemaining.isExpired ? (
                <Text style={[styles.deadlineTime, timeRemaining.totalSeconds < 600 ? styles.deadlineTimeUrgent : null]}>
                  {String(timeRemaining.hours).padStart(2, '0')}:
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </Text>
              ) : (
                <Text style={styles.deadlineExpired}>Expired</Text>
              )}
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

        <View style={styles.header}>
          <Text style={styles.title}>{t('payment') || 'Payment'}</Text>
          <Text style={styles.subtitle}>Complete payment to secure your ticket</Text>
        </View>

        {/* Invoice Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.invoiceHeader}>
            <Text style={styles.summaryTitle}>Trip Booking Receipt</Text>
            <View style={styles.receiptLine} />
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Price per Seat</Text>
            <Text style={styles.summaryValue}>ETB {price.basePrice}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seats Reserved</Text>
            <Text style={styles.summaryValue}>× {currentBooking.seats || 1}</Text>
          </View>

          {Number(currentBooking.pickupStation?.extraPrice) > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Station Add-on</Text>
              <Text style={styles.summaryValue}>+ ETB {currentBooking.pickupStation.extraPrice}</Text>
            </View>
          ) : null}

          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee (5%)</Text>
            <Text style={styles.summaryValue}>+ ETB {price.serviceFee}</Text>
          </View>

          <View style={styles.receiptLine} />

          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>ETB {totalPrice}</Text>
          </View>
        </View>

        {/* Chapa Payment Option Card */}
        <View style={styles.methodsContainer}>
          <View style={styles.methodCard}>
            <View style={styles.chapaLogoBadge}>
              <Text style={styles.methodIcon}>💳</Text>
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodName}>{t('chapa') || 'Chapa'}</Text>
              <Text style={styles.methodDescription}>
                Card, Mobile Money (Telebirr, CBE Birr) & Bank Transfer
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.secondary} />
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
        <ModernButton
          title={
            bookingExpired
              ? 'Booking Expired'
              : loading
                ? paymentProcessing
                  ? 'Verifying payment...'
                  : 'Opening Chapa checkout...'
                : `Pay ETB ${totalPrice} with Chapa`
          }
          onPress={handlePayment}
          disabled={!chapaReady || loading || bookingExpired}
          loading={loading}
          variant="primary"
          size="large"
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
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  invoiceHeader: {
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  receiptLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.grayDark,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  dashedDivider: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    marginVertical: SPACING.sm,
    height: 0,
  },
  totalLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '900',
    color: COLORS.iconSecondary,
  },
  methodsContainer: {
    marginBottom: SPACING.xl,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
    ...SHADOWS.small,
  },
  chapaLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 22,
  },
  methodContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  methodName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  methodDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  configWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.warning}15`,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  configWarningText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.xs,
    color: COLORS.charcoal,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  button: {
    width: '100%',
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  deadlineCardUrgent: {
    backgroundColor: `${COLORS.error}10`,
    borderColor: COLORS.error,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.charcoal,
  },
  deadlineTime: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.iconSecondary,
    marginTop: 2,
  },
  deadlineTimeUrgent: {
    color: COLORS.error,
  },
  deadlineExpired: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: COLORS.error,
  },
  expiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}10`,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  expiredText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    fontWeight: '700',
  },
});

export default PaymentScreen;
