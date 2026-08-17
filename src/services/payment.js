import axios from 'axios';
import { PAYMENT_CONFIG, isChapaKeyConfigured } from '../config/payment';

const CHAPA_ONLY = 'chapa';
const CHAPA_TITLE_MAX = 16;
const CHAPA_DESCRIPTION_MAX = 50;
const CHAPA_TX_REF_MAX = 50;

/**
 * Short unique tx_ref (Chapa max 50 chars; UUID booking ids are too long).
 */
const generateTransactionRef = (bookingId) => {
  const idPart = String(bookingId || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ref = `TK-${idPart}-${timePart}${randPart}`;
  return ref.slice(0, CHAPA_TX_REF_MAX);
};

const truncate = (value, max) => {
  const text = String(value || '').trim();
  return text.length > max ? text.slice(0, max) : text;
};

const formatChapaErrorMessage = (message) => {
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') {
    return Object.entries(message)
      .map(([field, errors]) => {
        const detail = Array.isArray(errors) ? errors.join(', ') : String(errors);
        return `${field}: ${detail}`;
      })
      .join('\n');
  }
  return 'Invalid payment request';
};

const formatPhoneForChapa = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('0')) return `251${digits.slice(1)}`;
  if (digits.length === 9) return `251${digits}`;
  return digits;
};

export const sanitizeEmailForChapa = (email, phone) => {
  let emailStr = typeof email === 'string' ? email.trim() : '';
  const strictEmailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (emailStr && !emailStr.startsWith('+') && strictEmailRegex.test(emailStr)) {
    return emailStr.toLowerCase();
  }

  let phoneStr = '';
  if (phone) {
    if (typeof phone === 'string' || typeof phone === 'number') {
      phoneStr = String(phone);
    } else if (typeof phone === 'object') {
      phoneStr = String(phone.number || phone.phone || phone.phoneNumber || '');
    }
  }

  const cleanPhone = phoneStr.replace(/\D/g, '');
  if (cleanPhone.length >= 7) {
    return `customer${cleanPhone}@gmail.com`;
  }

  return `customer${Date.now()}@gmail.com`;
};

/**
 * Chapa Payment Integration
 * https://developer.chapa.co/
 */
export const initiateChapaPayment = async (paymentData) => {
  if (!isChapaKeyConfigured(PAYMENT_CONFIG.chapa.apiKey)) {
    throw new Error(
      'Chapa is not configured. Add EXPO_PUBLIC_CHAPA_SECRET_KEY to your .env file and restart Expo.'
    );
  }

  try {
    const { amount, currency = 'ETB', phoneNumber, bookingId, customerName, customerEmail } = paymentData;

    const transactionRef = generateTransactionRef(bookingId);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const returnBase = PAYMENT_CONFIG.callbacks.returnUrl.replace(/\/$/, '');
    const returnUrl = `${returnBase}/?tx_ref=${encodeURIComponent(transactionRef)}`;

    const payload = {
      amount: numericAmount.toFixed(2),
      currency,
      email: sanitizeEmailForChapa(customerEmail, phoneNumber),
      first_name: (customerName || 'Customer').split(' ')[0] || 'Customer',
      last_name: (customerName || '').split(' ').slice(1).join(' ') || 'Guest',
      phone_number: formatPhoneForChapa(phoneNumber),
      tx_ref: transactionRef,
      callback_url: PAYMENT_CONFIG.callbacks.webhook,
      return_url: returnUrl,
      customization: {
        title: truncate('Tankua Booking', CHAPA_TITLE_MAX),
        description: truncate('Trip booking payment', CHAPA_DESCRIPTION_MAX),
      },
    };

    const response = await axios.post(
      `${PAYMENT_CONFIG.chapa.baseUrl}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYMENT_CONFIG.chapa.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data.status === 'success' && response.data.data?.checkout_url) {
      return {
        success: true,
        transactionRef,
        checkoutUrl: response.data.data.checkout_url,
        paymentId: response.data.data.id,
      };
    }

    throw new Error(response.data.message || 'Failed to initialize Chapa payment');
  } catch (error) {
    const apiMessage = error.response?.data?.message;
    console.error('Chapa payment error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Chapa authentication failed. Check EXPO_PUBLIC_CHAPA_SECRET_KEY in .env.');
    }

    if (error.response?.status === 400) {
      throw new Error(formatChapaErrorMessage(apiMessage));
    }

    throw new Error(
      formatChapaErrorMessage(apiMessage) ||
        error.message ||
        'Failed to start Chapa payment. Please try again.'
    );
  }
};

/**
 * Verify Chapa Payment
 */
export const verifyChapaPayment = async (transactionRef) => {
  if (!isChapaKeyConfigured(PAYMENT_CONFIG.chapa.apiKey)) {
    throw new Error('Chapa is not configured.');
  }

  try {
    const response = await axios.get(
      `${PAYMENT_CONFIG.chapa.baseUrl}/transaction/verify/${transactionRef}`,
      {
        headers: {
          Authorization: `Bearer ${PAYMENT_CONFIG.chapa.apiKey}`,
        },
        timeout: 30000,
      }
    );

    if (response.data.status === 'success') {
      const status = response.data.data?.status;
      return {
        success: true,
        verified: status === 'success' || status === 'successful',
        paymentData: response.data.data,
      };
    }

    return {
      success: false,
      verified: false,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Chapa verification error:', error.response?.data || error.message);
    throw new Error('Failed to verify Chapa payment');
  }
};

export const processPayment = async (paymentMethod, paymentData) => {
  if (paymentMethod !== CHAPA_ONLY) {
    throw new Error('Only Chapa Pay is available for bookings.');
  }
  return initiateChapaPayment(paymentData);
};

export const verifyPayment = async (paymentMethod, transactionRef) => {
  if (paymentMethod !== CHAPA_ONLY) {
    throw new Error('Only Chapa Pay is supported.');
  }
  return verifyChapaPayment(transactionRef);
};
