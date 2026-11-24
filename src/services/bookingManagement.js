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
// BOOKING CHANGES (pickup, seats, departure)
// ============================================
// Rules and prices live in the database (change_booking_for_user). The app
// asks for a quote, shows it, and applies the same change on confirm.
//
// change = { action: 'pickup' | 'seats' | 'reschedule', seats, tripId, stationId, pickupAddress }

const changeParams = (booking, change, apply) => ({
  p_booking_id: booking.id,
  p_action: change.action,
  p_seats: change.seats ?? null,
  p_trip_id: change.tripId ?? null,
  p_station_id: change.stationId ?? null,
  p_pickup_address: change.pickupAddress?.trim() || null,
  p_apply: apply,
});

/** Quote a change: { allowed, reason, new_total, refund_amount, refund_percentage, needs_new_booking, ... } */
export async function getBookingChangeQuote(booking, change) {
  const { data, error } = await supabase.rpc('change_booking', changeParams(booking, change, false));
  if (error) throw error;
  return data;
}

/** Apply a change. Throws with the reason if it is no longer allowed. */
export async function applyBookingChange(booking, change) {
  const { data, error } = await supabase.rpc('change_booking', changeParams(booking, change, true));
  if (error) throw error;
  if (change.action === 'reschedule') await cancelTripReminder(booking.id).catch(() => {});
  return data;
}

/** Other open departures this booking could move to (same destination and currency). */
export async function getRescheduleOptions(booking) {
  const { data, error } = await supabase
    .from('trips')
    .select('id, departure_date, price, currency, available_seats, status, providers (name)')
    .eq('destination_id', booking.destination_id)
    .eq('currency', booking.currency || 'ETB')
    .in('status', ['upcoming', 'active'])
    .gt('departure_date', new Date().toISOString())
    .gte('available_seats', booking.seats || 1)
    .neq('id', booking.trip_id)
    .order('departure_date', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data || [];
}

/** Active pickup points offered on a trip. */
export async function getPickupOptions(tripId) {
  const { data, error } = await supabase
    .from('trip_pickup_stations')
    .select('station_id, pickup_time, extra_price, pickup_stations (name, is_active, is_address_pickup)')
    .eq('trip_id', tripId);
  if (error) throw error;
  return (data || [])
    .filter((link) => link.pickup_stations?.is_active !== false)
    .map((link) => ({
      id: link.station_id,
      name: link.pickup_stations?.name || 'Pickup point',
      time: link.pickup_time,
      extraPrice: Number(link.extra_price || 0),
      isAddress: Boolean(link.pickup_stations?.is_address_pickup),
    }));
}
