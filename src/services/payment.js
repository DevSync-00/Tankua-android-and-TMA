import { supabase } from '../config/supabase';

/**
 * Chapa payments go through the `chapa-payment` Supabase Edge Function.
 * The Chapa secret key and the "mark booking paid" step live on the server;
 * the app only receives a checkout URL and a verification result.
 */

const invokePayment = async (body) => {
  const { data, error } = await supabase.functions.invoke('chapa-payment', { body });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context?.json?.();
      if (payload?.error) message = payload.error;
    } catch {
      // Response body was not JSON; keep the generic message.
    }
    throw new Error(message || 'Payment request failed');
  }
  return data;
};

/** Start checkout for a booking. Returns { checkoutUrl, transactionRef }. */
export const startChapaPayment = (bookingId) =>
  invokePayment({ action: 'initialize', bookingId });

/**
 * Start a top-up checkout for a booking change that costs more.
 * change = { action, seats, tripId, stationId, pickupAddress }.
 * Returns { checkoutUrl, transactionRef, amount, currency }.
 */
export const startChangePayment = (bookingId, change) =>
  invokePayment({ action: 'initialize_change', bookingId, change });

/** Complete any top-ups paid in a checkout the traveler left early. Returns { checked, completed }. */
export const verifyPendingChangePayments = () => invokePayment({ action: 'verify_pending' });

/**
 * Ask the server to verify with Chapa.
 * Returns { paid, status, bookingId, purpose } and, for top-ups, { applied, reason }.
 */
export const verifyChapaPayment = (transactionRef) =>
  invokePayment({ action: 'verify', transactionRef });
