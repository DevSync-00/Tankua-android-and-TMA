import { supabase } from '../config/supabase';

/**
 * Check if a booking is still valid (not expired)
 */
export const isBookingValid = (booking) => {
  if (!booking || booking.payment_status !== 'pending') {
    return false;
  }

  if (!booking.payment_deadline) {
    return true; // No deadline set, assume valid
  }

  const deadline = new Date(booking.payment_deadline);
  const now = new Date();
  
  return now < deadline;
};

/**
 * Get time remaining until payment deadline
 * Returns: { hours, minutes, seconds, totalSeconds, isExpired }
 */
export const getTimeRemaining = (paymentDeadline) => {
  if (!paymentDeadline) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false };
  }

  const deadline = new Date(paymentDeadline);
  const now = new Date();
  const diff = deadline - now;

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    totalSeconds: Math.floor(diff / 1000),
    isExpired: false,
  };
};

/**
 * Check and cancel expired bookings for a user
 */
export const checkAndCancelExpiredBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .not('payment_deadline', 'is', null);

    if (error) throw error;

    const now = new Date();
    const expiredBookings = [];

    for (const booking of data || []) {
      if (booking.payment_deadline) {
        const deadline = new Date(booking.payment_deadline);
        if (now >= deadline) {
          expiredBookings.push(booking.id);
        }
      }
    }

    if (expiredBookings.length > 0) {
      // Cancel expired bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .in('id', expiredBookings);

      if (updateError) throw updateError;

      return {
        cancelled: expiredBookings.length,
        bookingIds: expiredBookings,
      };
    }

    return { cancelled: 0, bookingIds: [] };
  } catch (error) {
    console.error('Error checking expired bookings:', error);
    throw error;
  }
};

/**
 * Verify booking is still valid before processing payment
 */
export const verifyBookingBeforePayment = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        valid: false,
        reason: 'Booking not found',
      };
    }

    if (data.payment_status !== 'pending') {
      return {
        valid: false,
        reason: data.payment_status === 'paid' 
          ? 'Payment already completed' 
          : 'Booking payment status is not pending',
      };
    }

    if (data.status === 'cancelled') {
      return {
        valid: false,
        reason: 'Booking has been cancelled',
      };
    }

    if (!isBookingValid(data)) {
      // Booking expired, cancel it
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', bookingId);

      return {
        valid: false,
        reason: 'Payment deadline has passed. Booking has been cancelled.',
      };
    }

    return {
      valid: true,
      booking: data,
    };
  } catch (error) {
    console.error('Error verifying booking:', error);
    throw error;
  }
};

