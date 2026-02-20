# Embedded Payment Form Setup Guide

## Overview
The subscription checkout page now uses an embedded Stripe payment form, allowing users to complete payments directly on your website without being redirected to Stripe's hosted checkout page.

## Setup Instructions

### 1. Add Stripe Publishable Key to Frontend

You need to add your Stripe **publishable key** to the frontend environment variables.

**For the root `.env` file (frontend):**

```bash
# Add this line to your .env file in the project root
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
```

**For development/testing, use your test key:**
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
```

### 2. Get Your Stripe Publishable Key

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Add it to your `.env` file as shown above

### 3. Restart Your Development Server

After adding the environment variable, restart your React development server:

```bash
npm start
```

## How It Works

### User Flow:
1. User visits `/subscription/checkout`
2. User clicks "Subscribe Now" on a plan
3. A payment dialog opens **on the same page**
4. User enters card information in the embedded Stripe form
5. Payment is processed securely through Stripe
6. Subscription is created in your database
7. User is redirected to success page

### Technical Flow:
1. **Frontend** calls `/api/subscriptions/create-payment-intent` with plan ID
2. **Backend** creates a Stripe PaymentIntent and returns client secret
3. **Frontend** uses Stripe.js to confirm the payment with card details
4. **Frontend** calls `/api/subscriptions/confirm-subscription` with payment intent ID
5. **Backend** creates Stripe subscription and saves to database
6. **Success!** User now has an active subscription

## Features

✅ **No Redirect** - Users stay on your website throughout the payment process
✅ **Secure** - Card details never touch your server (handled by Stripe.js)
✅ **Real-time Validation** - Instant feedback on card information
✅ **Mobile Friendly** - Responsive design works on all devices
✅ **Error Handling** - Clear error messages for failed payments
✅ **Loading States** - Visual feedback during payment processing

## Testing

Use Stripe's test cards to test the payment flow:

### Successful Payment:
- **Card Number:** 4242 4242 4242 4242
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Failed Payment (Insufficient Funds):
- **Card Number:** 4000 0000 0000 9995
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### Requires Authentication (3D Secure):
- **Card Number:** 4000 0025 0000 3155
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

## Files Modified

### Backend:
- `server/routes/subscriptions.js` - Added new routes for payment intent
- `server/controllers/subscriptionController.js` - Added `createPaymentIntent` and `confirmSubscription` methods
- `src/services/api.js` - Added API methods for embedded payment

### Frontend:
- `src/layouts/subscription-checkout/index.js` - Updated to use embedded payment dialog
- `src/layouts/subscription-checkout/PaymentForm.js` - New component for payment form
- `package.json` - Added `@stripe/stripe-js` and `@stripe/react-stripe-js` dependencies

## Environment Variables Summary

### Frontend (.env in project root):
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_your_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend (server/.env):
```bash
STRIPE_SECRET_KEY=sk_test_or_sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### "Stripe is not configured" Error
- Make sure `REACT_APP_STRIPE_PUBLISHABLE_KEY` is set in your `.env` file
- Restart your development server after adding the variable
- Check that the key starts with `pk_test_` or `pk_live_`

### Payment Dialog Doesn't Open
- Check browser console for errors
- Verify Stripe.js is loading correctly
- Ensure you have an active internet connection (Stripe.js loads from CDN)

### Payment Fails
- Check that your Stripe secret key is configured in `server/.env`
- Verify the plan has a valid `stripe_price_id` (run `node server/setup-stripe-plans.js` if needed)
- Check server logs for detailed error messages

## Security Notes

- ✅ Card details are handled entirely by Stripe.js - they never touch your server
- ✅ Payment intents are verified on the backend before creating subscriptions
- ✅ User authentication is required for all payment operations
- ✅ Stripe uses industry-standard encryption (TLS 1.2+)
- ✅ PCI compliance is handled by Stripe

## Support

For issues with:
- **Stripe Integration:** Check [Stripe Documentation](https://stripe.com/docs)
- **Payment Issues:** Review Stripe Dashboard logs
- **Code Issues:** Check browser console and server logs

---

**Ready to go!** Once you add the `REACT_APP_STRIPE_PUBLISHABLE_KEY` to your `.env` file and restart the server, users will be able to subscribe using the embedded payment form.
