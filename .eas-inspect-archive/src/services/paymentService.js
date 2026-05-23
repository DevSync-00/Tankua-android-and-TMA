/**
 * Enhanced Payment Service
 * Handles all payment operations with proper error handling and transaction tracking
 */

import axios from 'axios';
import { supabase } from '../config/supabase';
import { PAYMENT_CONFIG, PAYMENT_STATUS, PAYMENT_METHODS } from '../config/payment';

// ============================================
// TRANSACTION REFERENCE GENERATION
// ============================================

/**
 * Generate a unique transaction reference
 */
export const generateTransactionRef = (bookingId) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TK-${bookingId?.substring(0, 8) || 'NEW'}-${timestamp}-${random}`.toUpperCase();
};

// ============================================
// TRANSACTION TRACKING
// ============================================

/**
 * Create a payment transaction record
 */
export const createPaymentTransaction = async ({
  bookingId,
  userId,
  amount,
  currency = 'ETB',
  paymentMethod,
  transactionRef,
}) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        amount,
        currency,
        payment_method: paymentMethod,
        transaction_ref: transactionRef,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
};

/**
 * Update payment transaction status
 */
export const updatePaymentTransaction = async (transactionRef, updates) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('transaction_ref', transactionRef)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    throw error;
  }
};

/**
 * Get payment transaction by reference
 */
export const getPaymentTransaction = async (transactionRef) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*, bookings(*)')
      .eq('transaction_ref', transactionRef)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment transaction:', error);
    throw error;
  }
};

// ============================================
// CHAPA PAYMENT INTEGRATION
// ============================================

/**
 * Initialize Chapa payment
 */
export const initiateChapaPayment = async (paymentData) => {
  const { amount, currency = 'ETB', phoneNumber, bookingId, customerName, customerEmail, userId } = paymentData;
  
  const transactionRef = generateTransactionRef(bookingId);

  try {
    // Check if API key is configured
    const apiKey = PAYMENT_CONFIG.chapa.apiKey;
    if (!apiKey || apiKey.includes('xxxxx') || apiKey === 'CHk_test_xxxxxxxxxxxxx') {
      throw new Error('CHAPA_NOT_CONFIGURED');
    }

    // Create transaction record first
    await createPaymentTransaction({
      bookingId,
      userId,
      amount,
      currency,
      paymentMethod: 'chapa',
      transactionRef,
    });

    // Prepare Chapa payload
    const payload = {
      amount: amount.toString(),
      currency,
      email: customerEmail || `${phoneNumber?.replace(/\+/g, '') || 'customer'}@tankua.app`,
      first_name: customerName?.split(' ')[0] || 'Customer',
      last_name: customerName?.split(' ').slice(1).join(' ') || '',
      phone_number: phoneNumber || '',
      tx_ref: transactionRef,
      callback_url: PAYMENT_CONFIG.callbacks.webhook,
      return_url: `${PAYMENT_CONFIG.callbacks.success}?tx_ref=${transactionRef}`,
      customization: {
        title: 'Tankua - Trip Booking',
        description: `Booking payment - ${bookingId}`,
        logo: 'https://tankua.app/logo.png',
      },
    };

    // Make API request to Chapa
    const response = await axios.post(
      `${PAYMENT_CONFIG.chapa.baseUrl}/transaction/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data.status === 'success' && response.data.data?.checkout_url) {
      // Update transaction with checkout URL
      await updatePaymentTransaction(transactionRef, {
        checkout_url: response.data.data.checkout_url,
        external_ref: response.data.data.id || null,
        status: 'processing',
        provider_response: response.data,
      });

      return {
        success: true,
        transactionRef,
        checkoutUrl: response.data.data.checkout_url,
        paymentId: response.data.data.id,
      };
    }

    throw new Error(response.data.message || 'Failed to initialize payment');
  } catch (error) {
    // Update transaction with error
    await updatePaymentTransaction(transactionRef, {
      status: 'failed',
      error_message: error.message,
      provider_response: error.response?.data || null,
    }).catch(() => {});

    // Handle specific errors
    if (error.message === 'CHAPA_NOT_CONFIGURED') {
      throw new Error('Payment gateway not configured. Please contact support.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Payment authentication failed. Please try again later.');
    }
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid payment request');
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Payment request timed out. Please try again.');
    }

    throw new Error(error.message || 'Failed to process payment');
  }
};

/**
 * Verify Chapa payment
 */
export const verifyChapaPayment = async (transactionRef) => {
  try {
    const apiKey = PAYMENT_CONFIG.chapa.apiKey;
    
    const response = await axios.get(
      `${PAYMENT_CONFIG.chapa.baseUrl}/transaction/verify/${transactionRef}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 15000,
      }
    );

    const isSuccess = response.data.status === 'success' && 
                      response.data.data?.status === 'success';

    // Update transaction record
    await updatePaymentTransaction(transactionRef, {
      status: isSuccess ? 'success' : 'pending',
      verified_at: isSuccess ? new Date().toISOString() : null,
      verified_by: 'api',
      provider_response: response.data,
      completed_at: isSuccess ? new Date().toISOString() : null,
    });

    if (isSuccess) {
      // Update booking status
      const transaction = await getPaymentTransaction(transactionRef);
      if (transaction?.booking_id) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', transaction.booking_id);
      }
    }

    return {
      success: true,
      verified: isSuccess,
      paymentData: response.data.data,
      transactionRef,
    };
  } catch (error) {
    console.error('Chapa verification error:', error);
    return {
      success: false,
      verified: false,
      message: error.message || 'Verification failed',
    };
  }
};

// ============================================
// TELEBIRR PAYMENT INTEGRATION
// ============================================

/**
 * Initialize Telebirr payment
 */
export const initiateTelebirrPayment = async (paymentData) => {
  const { amount, phoneNumber, bookingId, customerName, userId } = paymentData;
  
  const transactionRef = generateTransactionRef(bookingId);

  try {
    // Check if credentials are configured
    const { appId, appKey } = PAYMENT_CONFIG.telebirr;
    if (!appId || appId === 'your-app-id' || !appKey || appKey === 'your-app-key') {
      throw new Error('TELEBIRR_NOT_CONFIGURED');
    }

    // Create transaction record
    await createPaymentTransaction({
      bookingId,
      userId,
      amount,
      currency: 'ETB',
      paymentMethod: 'telebirr',
      transactionRef,
    });

    // Telebirr payload (adjust based on actual API documentation)
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    
    const payload = {
      appId,
      appKey,
      subject: `Tankua Booking - ${bookingId}`,
      totalAmount: amount.toString(),
      outTradeNo: transactionRef,
      notifyUrl: PAYMENT_CONFIG.callbacks.webhook,
      returnUrl: `${PAYMENT_CONFIG.callbacks.success}?tx_ref=${transactionRef}`,
      timeoutExpress: '30',
      shortCode: PAYMENT_CONFIG.telebirr.shortCode || '',
      receiveName: 'Tankua Travel',
      timestamp,
    };

    const response = await axios.post(
      `${PAYMENT_CONFIG.telebirr.baseUrl}/v1/payment/create`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data.success || response.data.code === '0000') {
      const paymentUrl = response.data.data?.paymentUrl || response.data.paymentUrl;
      const qrCode = response.data.data?.qrCode || response.data.qrCode;

      await updatePaymentTransaction(transactionRef, {
        checkout_url: paymentUrl,
        status: 'processing',
        provider_response: response.data,
      });

      return {
        success: true,
        transactionRef,
        paymentUrl,
        qrCode,
        ussdCode: response.data.data?.ussdCode,
      };
    }

    throw new Error(response.data.message || 'Failed to initialize Telebirr payment');
  } catch (error) {
    await updatePaymentTransaction(transactionRef, {
      status: 'failed',
      error_message: error.message,
      provider_response: error.response?.data || null,
    }).catch(() => {});

    if (error.message === 'TELEBIRR_NOT_CONFIGURED') {
      throw new Error('Telebirr not configured. Please use Chapa or contact support.');
    }

    throw new Error(error.message || 'Failed to process Telebirr payment');
  }
};

/**
 * Verify Telebirr payment
 */
export const verifyTelebirrPayment = async (transactionRef) => {
  try {
    const { appId, appKey, baseUrl } = PAYMENT_CONFIG.telebirr;

    const response = await axios.post(
      `${baseUrl}/v1/payment/query`,
      {
        appId,
        appKey,
        outTradeNo: transactionRef,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const isSuccess = (response.data.success || response.data.code === '0000') &&
                      (response.data.data?.status === 'SUCCESS' || 
                       response.data.data?.tradeStatus === 'TRADE_SUCCESS');

    await updatePaymentTransaction(transactionRef, {
      status: isSuccess ? 'success' : 'pending',
      verified_at: isSuccess ? new Date().toISOString() : null,
      verified_by: 'api',
      provider_response: response.data,
      completed_at: isSuccess ? new Date().toISOString() : null,
    });

    if (isSuccess) {
      const transaction = await getPaymentTransaction(transactionRef);
      if (transaction?.booking_id) {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', transaction.booking_id);
      }
    }

    return {
      success: true,
      verified: isSuccess,
      paymentData: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Telebirr verification error:', error);
    return {
      success: false,
      verified: false,
      message: error.message || 'Verification failed',
    };
  }
};

// ============================================
// DEVELOPMENT MODE SIMULATION
// ============================================

/**
 * Check if we're in development mode
 */
export const isDevelopmentMode = () => {
  const chapaKey = PAYMENT_CONFIG.chapa.apiKey;
  const telebirrAppId = PAYMENT_CONFIG.telebirr.appId;
  
  return (
    !chapaKey || 
    chapaKey.includes('xxxxx') || 
    chapaKey === 'CHk_test_xxxxxxxxxxxxx' ||
    !telebirrAppId ||
    telebirrAppId === 'your-app-id'
  );
};

/**
 * Simulate payment for development
 */
export const simulatePayment = async (paymentMethod, paymentData) => {
  const transactionRef = generateTransactionRef(paymentData.bookingId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create transaction record
  if (paymentData.bookingId && paymentData.userId) {
    await createPaymentTransaction({
      bookingId: paymentData.bookingId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: 'ETB',
      paymentMethod,
      transactionRef,
    }).catch(console.error);
  }
  
  return {
    success: true,
    transactionRef,
    checkoutUrl: null,
    paymentId: `dev-${Date.now()}`,
    isDevelopment: true,
  };
};

// ============================================
// UNIFIED PAYMENT PROCESSING
// ============================================

/**
 * Process payment based on selected method
 */
export const processPayment = async (paymentMethod, paymentData) => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  
  // Development mode simulation
  if (isDevelopmentMode() && isDev) {
    console.warn('⚠️ Development mode: Simulating payment');
    return await simulatePayment(paymentMethod, paymentData);
  }

  switch (paymentMethod) {
    case PAYMENT_METHODS.CHAPA:
    case 'chapa':
      return await initiateChapaPayment(paymentData);
      
    case PAYMENT_METHODS.TELEBIRR:
    case 'telebirr':
      return await initiateTelebirrPayment(paymentData);
      
    case PAYMENT_METHODS.CBE_BIRR:
    case 'cbe':
      throw new Error('CBE Birr integration coming soon. Please use Chapa or Telebirr.');
      
    case PAYMENT_METHODS.AMOLE:
    case 'amole':
      throw new Error('Amole integration coming soon. Please use Chapa or Telebirr.');
      
    default:
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }
};

/**
 * Verify payment based on method
 */
export const verifyPayment = async (paymentMethod, transactionRef) => {
  switch (paymentMethod) {
    case PAYMENT_METHODS.CHAPA:
    case 'chapa':
      return await verifyChapaPayment(transactionRef);
      
    case PAYMENT_METHODS.TELEBIRR:
    case 'telebirr':
      return await verifyTelebirrPayment(transactionRef);
      
    default:
      throw new Error(`Cannot verify payment method: ${paymentMethod}`);
  }
};

/**
 * Get user's payment history
 */
export const getPaymentHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        bookings (
          id,
          trip_id,
          seats,
          status,
          trips (
            destination_id,
            departure_date,
            destinations (name, city)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

/**
 * Request a refund
 */
export const requestRefund = async ({ transactionId, bookingId, userId, amount, reason }) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        payment_transaction_id: transactionId,
        booking_id: bookingId,
        user_id: userId,
        amount,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};


