import { supabase } from '../config/supabase';

export const BOOKING_WITH_TRIP = '*, trip:trips(status, departure_date, return_date, duration_minutes, revised_end_at, closeout_reason), refunds(status, amount, currency)';

export const canPayForTrip = (trip) => (
  trip?.status === 'active' && Date.parse(trip.departure_date) > Date.now()
);

export const getBookingForPayment = async (bookingId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_TRIP)
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Check if a booking is still valid (not expired)
 */
export const isBookingValid = (booking) => {
  return booking?.payment_status === 'pending'
    && booking.status === 'confirmed'
    && canPayForTrip(booking.trip)
    && Date.parse(booking.payment_deadline) > Date.now();
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
 * Verify booking is still valid before processing payment
 */
export const verifyBookingBeforePayment = async (bookingId) => {
  try {
    const data = await getBookingForPayment(bookingId);

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

    if (data.status !== 'confirmed' || !canPayForTrip(data.trip) || !data.payment_deadline) {
      return {
        valid: false,
        reason: 'Payment is available for current reservations once the trip is active.',
      };
    }

    if (!isBookingValid(data)) {
      return {
        valid: false,
        reason: 'The payment window has ended.',
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

