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
import Button from '../../components/Button';
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

  // Initialize booking and set up countdown timer
  useEffect(() => {
    let isMounted = true;

    const initializeBooking = async () => {
      if (!user) return;

      try {
        // Check for existing expired bookings first
        await checkAndCancelExpiredBookings(user.id);

        // Create booking if not already created
        if (!booking && isMounted) {
          // Validate profile before creating booking
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

  // Update countdown timer
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

    update(); // Initial update
    intervalRef.current = setInterval(update, 1000); // Update every second
  };

  // Handle booking expiration
  const handleBookingExpired = async () => {
    if (!booking) return;

    try {
      // Cancel the booking
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
      // Verify booking is still valid before processing payment
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

      const price = calculateTotalPrice();

      // Prepare payment data
      const phoneNumber = user?.phone_number || user?.phoneNumber || '';
      const customerName = user?.name || 'Customer';
      const customerEmail = user?.email || (phoneNumber ? `${phoneNumber}@tankua.app` : 'customer@tankua.app');

      const paymentData = {
        amount: price.total,
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
      
      // Provide helpful messages for common errors
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
        // Payment successful - update booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        // Fetch updated booking
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
        // Payment not yet verified - might need to wait
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('payment')}</Text>
        <Text style={styles.subtitle}>Pay securely with Chapa Pay</Text>

        {/* Payment Deadline Warning */}
        {booking?.payment_deadline && !bookingExpired ? (
          <View style={[
            styles.deadlineCard,
            timeRemaining != null && timeRemaining.totalSeconds < 600
              ? styles.deadlineCardUrgent
              : null,
          ]}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={timeRemaining?.totalSeconds < 600 ? COLORS.error : COLORS.warning} 
            />
            <View style={styles.deadlineContent}>
              <Text style={[
                styles.deadlineTitle,
                timeRemaining != null && timeRemaining.totalSeconds < 600
                  ? styles.deadlineTitleUrgent
                  : null,
              ]}>
                {timeRemaining?.totalSeconds < 600 
                  ? 'Payment Due Soon!' 
                  : 'Complete Payment Within'}
              </Text>
              {timeRemaining && !timeRemaining.isExpired ? (
                <Text style={[
                  styles.deadlineTime,
                  timeRemaining.totalSeconds < 600 ? styles.deadlineTimeUrgent : null,
                ]}>
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
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
            <Text style={styles.expiredText}>
              Your booking has expired. Payment must be completed within 2 hours.
            </Text>
          </View>
        ) : null}

        {/* Price Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Trip Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Price</Text>
            <Text style={styles.summaryValue}>{price.basePrice} ETB</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>×{currentBooking.seats || 1}</Text>
          </View>

          {Number(currentBooking.pickupStation?.extraPrice) > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Station Fee</Text>
              <Text style={styles.summaryValue}>
                +{currentBooking.pickupStation.extraPrice} ETB
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee (5%)</Text>
            <Text style={styles.summaryValue}>+{price.serviceFee} ETB</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalPrice} ETB</Text>
          </View>
        </View>

        {/* Chapa — sole payment provider */}
        <View style={styles.methodsContainer}>
          <View style={[styles.methodCard, styles.methodCardSelected]}>
            <Text style={styles.methodIcon}>💰</Text>
            <View style={styles.methodContent}>
              <Text style={styles.methodName}>{t('chapa') || 'Chapa'}</Text>
              <Text style={styles.methodDescription}>
                Card, mobile money and bank transfer via Chapa Pay
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </View>

          {!chapaReady ? (
            <View style={styles.configWarning}>
              <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
              <Text style={styles.configWarningText}>
                Chapa is not configured. Set EXPO_PUBLIC_CHAPA_SECRET_KEY in .env and restart Expo.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            bookingExpired
              ? 'Booking Expired'
              : loading
                ? paymentProcessing
                  ? 'Verifying payment...'
                  : 'Opening Chapa checkout...'
                : `Pay ${totalPrice} ETB with Chapa`
          }
          onPress={handlePayment}
          disabled={!chapaReady || loading || bookingExpired}
          loading={loading}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  totalValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  methodsContainer: {
    marginBottom: SPACING.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  methodIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  methodDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray,
  },
  configWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.warning}18`,
  },
  configWarningText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.secondary,
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
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  deadlineCardUrgent: {
    backgroundColor: `${COLORS.error}15`,
    borderLeftColor: COLORS.error,
  },
  deadlineContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  deadlineTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  deadlineTitleUrgent: {
    color: COLORS.error,
  },
  deadlineTime: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.warning,
    fontFamily: 'monospace',
  },
  deadlineTimeUrgent: {
    color: COLORS.error,
  },
  deadlineExpired: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  expiredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  expiredText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: '500',
  },
});

export default PaymentScreen;

