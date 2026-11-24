# Payment Integration Setup Guide

> **Outdated — do not follow the environment-variable steps below.**
> Mobile payments now run through the `chapa-payment` Supabase Edge Function
> (`supabase/functions/chapa-payment`). The Chapa key is a server secret:
>
> ```bash
> supabase secrets set CHAPA_SECRET_KEY=your_chapa_secret_key
> supabase functions deploy chapa-payment
> ```
>
> Never put a payment key in an `EXPO_PUBLIC_*` variable; those ship inside the app.
> Telebirr is not implemented.

This guide explains how to set up Chapa and Telebirr payment integrations for Tankua.

## Overview

The app supports two payment gateways:
- **Chapa** - Payment gateway for Ethiopia
- **Telebirr** - Mobile money service by Ethio Telecom

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory (or use Expo's environment variables):

```env
EXPO_PUBLIC_CHAPA_API_KEY=your_chapa_api_key_here
EXPO_PUBLIC_TELEBIRR_APP_ID=your_telebirr_app_id
EXPO_PUBLIC_TELEBIRR_APP_KEY=your_telebirr_app_key
EXPO_PUBLIC_TELEBIRR_PUBLIC_KEY=your_telebirr_public_key
EXPO_PUBLIC_TELEBIRR_BASE_URL=https://telebirr-api.com
EXPO_PUBLIC_WEBHOOK_URL=https://your-backend.com/api/payments/webhook
```

**Important**: Never commit `.env` files to version control. Add `.env` to `.gitignore`.

### 2. Chapa Setup

1. **Sign up** at [Chapa Developer Portal](https://developer.chapa.co/)
2. **Create an account** and verify your business
3. **Get your API key** from the dashboard
4. **Add the API key** to your environment variables

**Chapa API Documentation**: https://developer.chapa.co/

**Test Mode**: Chapa provides test API keys for development. Use these for testing.

### 3. Telebirr Setup

1. **Contact Telebirr** for merchant account setup
2. **Get your credentials**:
   - App ID
   - App Key
   - Public Key
   - API Base URL
3. **Add credentials** to environment variables

**Note**: Telebirr API documentation may vary. Adjust the integration in `src/services/payment.js` based on their official documentation.

## Payment Flow

### Current Implementation

1. **User selects payment method** (Chapa or Telebirr)
2. **Booking is created** with `payment_status: 'pending'`
3. **Payment is initiated** via the payment gateway API
4. **User completes payment** (via browser/QR code/app)
5. **Payment is verified** using transaction reference
6. **Booking status is updated** to `payment_status: 'paid'`

### Chapa Flow

1. User clicks "Pay"
2. App calls Chapa API to initialize payment
3. Chapa returns a checkout URL
4. App opens checkout URL in browser
5. User completes payment in browser
6. User returns to app and clicks "I've Completed Payment"
7. App verifies payment with Chapa
8. Booking is confirmed

### Telebirr Flow

1. User clicks "Pay"
2. App calls Telebirr API to create payment
3. Telebirr returns payment URL or QR code
4. User completes payment via Telebirr app
5. User confirms payment in app
6. App verifies payment with Telebirr
7. Booking is confirmed

## Backend Webhook (Recommended)

For production, set up webhooks to handle payment callbacks automatically:

### Webhook Endpoint

Create a webhook endpoint on your backend:

```javascript
// Example webhook handler (Node.js/Express)
app.post('/api/payments/webhook', async (req, res) => {
  const { tx_ref, status, amount } = req.body;
  
  // Verify webhook signature (important for security)
  // Update booking status in database
  // Send notification to user
  
  res.status(200).json({ received: true });
});
```

### Webhook Configuration

1. **Chapa**: Configure webhook URL in Chapa dashboard
2. **Telebirr**: Configure webhook URL in Telebirr merchant portal

## Security Considerations

### ⚠️ Important Security Notes

1. **Never expose API keys in client code**: 
   - Current implementation uses environment variables
   - For production, move payment processing to backend
   - Use Supabase Edge Functions or your own backend

2. **Verify webhook signatures**:
   - Always verify webhook signatures before processing
   - Chapa and Telebirr provide signature verification methods

3. **Use HTTPS**:
   - All payment endpoints must use HTTPS
   - Never send payment data over HTTP

4. **Store transaction references**:
   - Store transaction references in database
   - Use them for payment verification and reconciliation

## Testing

### Test Mode

Both Chapa and Telebirr provide test/sandbox environments:

1. **Chapa**: Use test API keys (starts with `CHk_test_`)
2. **Telebirr**: Use sandbox credentials provided by Telebirr

### Test Scenarios

1. ✅ Successful payment
2. ✅ Failed payment
3. ✅ Payment timeout
4. ✅ Payment cancellation
5. ✅ Payment verification

## Production Checklist

Before going live:

- [ ] Replace test API keys with production keys
- [ ] Set up webhook endpoints
- [ ] Configure webhook URLs in payment gateway dashboards
- [ ] Test payment flow end-to-end
- [ ] Set up payment reconciliation process
- [ ] Configure error handling and logging
- [ ] Set up monitoring and alerts
- [ ] Review security measures
- [ ] Test refund process (if applicable)

## Troubleshooting

### Payment Not Initiating

1. Check API keys are correct
2. Verify network connectivity
3. Check API endpoint URLs
4. Review error logs in console

### Payment Verification Failing

1. Ensure transaction reference is stored correctly
2. Check payment gateway API status
3. Verify webhook is receiving callbacks
4. Review payment gateway logs

### User Not Redirected Back

1. Check callback URLs are configured correctly
2. Verify deep linking is set up in app
3. Test URL opening functionality

## Support

For issues:
- **Chapa**: support@chapa.co or [Chapa Documentation](https://developer.chapa.co/)
- **Telebirr**: Contact your Telebirr merchant account manager

## Next Steps

1. **CBE Birr Integration**: Similar structure to Telebirr
2. **Amole Integration**: Similar structure to Telebirr
3. **Payment History**: Track all transactions
4. **Refund System**: Handle cancellations and refunds
5. **Payment Analytics**: Track payment success rates

