/**
 * Booking Management Service
 * Handles cancellation, rescheduling, and booking modifications
 */

import { supabase } from '../config/supabase';
import { cancelTripReminder, showBookingCancellation } from './notifications';

// ============================================
// CANCELLATION
// ============================================
// The refund policy lives in the database (booking_cancellation_terms):
// 48h+ before departure: 100% · 24-48h: 50% · under 24h: no refund.
// The app shows the server's quote and never computes refunds itself.

/**
 * What cancelling this booking right now would mean:
 * { can_cancel, reason, paid, amount_paid, refund_percentage, refund_amount, currency, seats }
 */
export async function getCancellationQuote(bookingId) {
  const { data, error } = await supabase.rpc('booking_cancellation_quote', { p_booking_id: bookingId });
  if (error) throw error;
  return data;
}

/**
 * Cancel a booking. Paid bookings queue a refund for review; unpaid
 * reservations are released. Either way the seats go back on sale.
 */
export async function cancelBooking(booking, reason = null) {
  const cleanReason = reason?.trim() || null;
  const result = booking.payment_status === 'paid'
    ? await supabase.rpc('cancel_paid_booking', { p_booking_id: booking.id, p_reason: cleanReason })
    : await supabase.rpc('release_unpaid_booking', { p_booking_id: booking.id });
  if (result.error) throw result.error;

  await cancelTripReminder(booking.id).catch(() => {});
  await showBookingCancellation({
    id: booking.id,
    destinationName: booking.destination_name || booking.trip?.destinations?.name || 'Trip',
  }).catch(() => {});

  return result.data;
}


// ============================================
// RESCHEDULING
// ============================================

/**
 * Check if booking can be rescheduled
 */
export function canRescheduleBooking(booking) {
  const validStatuses = ['pending', 'confirmed'];
  
  if (!validStatuses.includes(booking.status)) {
    return {
      canReschedule: false,
      reason: `Cannot reschedule booking with status: ${booking.status}`,
    };
  }

  const tripDate = new Date(booking.trip_date || booking.departure_date);
  const hoursUntilTrip = (tripDate - new Date()) / (1000 * 60 * 60);

  if (hoursUntilTrip < 24) {
    return {
      canReschedule: false,
      reason: 'Cannot reschedule within 24 hours of trip',
    };
  }

  return {
    canReschedule: true,
    feeApplicable: hoursUntilTrip < 48,
    fee: hoursUntilTrip < 48 ? 100 : 0, // 100 ETB fee if less than 48 hours
  };
}

/**
 * Get available trips for rescheduling
 */
export async function getAvailableTripsForReschedule(booking) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        destinations (name, city)
      `)
      .eq('destination_id', booking.destination_id)
      .eq('status', 'upcoming')
      .gt('departure_date', new Date().toISOString())
      .gte('available_seats', booking.seats)
      .neq('id', booking.trip_id)
      .order('departure_date', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available trips:', error);
    throw error;
  }
}

/**
 * Reschedule a booking to a new trip
 */
export async function rescheduleBooking(bookingId, userId, newTripId) {
  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        trips (
          id,
          available_seats,
          departure_date
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Verify ownership
    if (booking.user_id !== userId) {
      throw new Error('Unauthorized to reschedule this booking');
    }

    // Check if rescheduling is allowed
    const { canReschedule, reason, fee } = canRescheduleBooking(booking);
    if (!canReschedule) {
      throw new Error(reason);
    }

    // Get new trip details
    const { data: newTrip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', newTripId)
      .single();

    if (tripError) throw tripError;

    // Check seat availability
    if (newTrip.available_seats < booking.seats) {
      throw new Error('Not enough seats available on the new trip');
    }

    // Release seats from old trip
    if (booking.trips) {
      await supabase
        .from('trips')
        .update({ 
          available_seats: booking.trips.available_seats + booking.seats 
        })
        .eq('id', booking.trips.id);
    }

    // Reserve seats on new trip
    await supabase
      .from('trips')
      .update({ 
        available_seats: newTrip.available_seats - booking.seats 
      })
      .eq('id', newTripId);

    // Calculate new total (if price difference)
    const priceDifference = newTrip.price - (booking.total_price / booking.seats);
    const additionalPayment = priceDifference * booking.seats + (fee || 0);

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        trip_id: newTripId,
        rescheduled_at: new Date().toISOString(),
        rescheduled_from_trip_id: booking.trip_id,
        reschedule_fee: fee || 0,
        // Keep status as is, payment status might need update if additional payment
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Cancel old trip reminder and schedule new one
    await cancelTripReminder(bookingId);

    return {
      success: true,
      newTripDate: newTrip.departure_date,
      fee,
      additionalPayment: additionalPayment > 0 ? additionalPayment : 0,
      message: fee > 0 
        ? `Rescheduling successful. Fee: ${fee} ETB` 
        : 'Rescheduling successful. No additional fee.',
    };
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
}

// ============================================
// BOOKING MODIFICATIONS
// ============================================

/**
 * Modify seat count for a booking
 */
export async function modifySeats(bookingId, userId, newSeatCount) {
  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        trips (
          id,
          available_seats,
          price
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Verify ownership
    if (booking.user_id !== userId) {
      throw new Error('Unauthorized to modify this booking');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error('Cannot modify seats for this booking');
    }

    const seatDifference = newSeatCount - booking.seats;

    if (seatDifference > 0) {
      // Adding seats - check availability
      if (booking.trips.available_seats < seatDifference) {
        throw new Error(`Only ${booking.trips.available_seats} additional seats available`);
      }
    }

    // Calculate new price
    const pricePerSeat = booking.trips.price;
    const newTotalPrice = newSeatCount * pricePerSeat;
    const priceDifference = newTotalPrice - booking.total_price;

    // Update trip available seats
    await supabase
      .from('trips')
      .update({ 
        available_seats: booking.trips.available_seats - seatDifference 
      })
      .eq('id', booking.trips.id);

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        seats: newSeatCount,
        total_price: newTotalPrice,
        modified_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return {
      success: true,
      oldSeats: booking.seats,
      newSeats: newSeatCount,
      priceDifference,
      newTotalPrice,
      requiresAdditionalPayment: priceDifference > 0,
    };
  } catch (error) {
    console.error('Error modifying seats:', error);
    throw error;
  }
}

/**
 * Change pickup station for a booking
 */
export async function changePickupStation(bookingId, userId, newStationId) {
  try {
    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Verify ownership
    if (booking.user_id !== userId) {
      throw new Error('Unauthorized to modify this booking');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error('Cannot change pickup station for this booking');
    }

    // Get new station details
    const { data: newStation, error: stationError } = await supabase
      .from('pickup_stations')
      .select('*')
      .eq('id', newStationId)
      .single();

    if (stationError) throw stationError;

    // Get old station for price comparison
    let priceDifference = 0;
    if (booking.pickup_station_id) {
      const { data: oldStation } = await supabase
        .from('pickup_stations')
        .select('extra_price')
        .eq('id', booking.pickup_station_id)
        .single();

      if (oldStation) {
        priceDifference = (newStation.extra_price || 0) - (oldStation.extra_price || 0);
      }
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        pickup_station_id: newStationId,
        total_price: booking.total_price + priceDifference,
        modified_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return {
      success: true,
      newStation: newStation.name,
      priceDifference,
      newTotalPrice: booking.total_price + priceDifference,
    };
  } catch (error) {
    console.error('Error changing pickup station:', error);
    throw error;
  }
}

// ============================================
// BOOKING HISTORY
// ============================================

/**
 * Get booking history with all modifications
 */
export async function getBookingHistory(bookingId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trips (
          departure_date,
          destinations (name)
        ),
        pickup_stations (name),
        refunds (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching booking history:', error);
    throw error;
  }
}


