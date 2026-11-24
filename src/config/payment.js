// Payment configuration.
// Chapa credentials are server-side only: see supabase/functions/chapa-payment.

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = {
  CHAPA: 'chapa',
};
