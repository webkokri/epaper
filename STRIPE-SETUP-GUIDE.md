# Stripe Payment Integration Setup Guide

## Overview
To enable subscription payments, you need to configure Stripe integration. This guide will walk you through the complete setup process.

## Prerequisites
- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard

## Step 1: Get Your Stripe API Keys

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to Developers > API keys**
3. **Copy your keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Configure Environment Variables

Add the following to your `server/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000
```

**Important**: 
- Use **test keys** (starting with `sk_test_` and `pk_test_`) for development
- Use **live keys** (starting with `sk_live_` and `pk_live_`) for production
- Never commit your `.env` file to version control

## Step 3: Set Up Stripe Webhook (Optional but Recommended)

Webhooks allow Stripe to notify your application about payment events.

### For Local Development:
1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook
   ```
4. **Copy the webhook signing secret** (starts with `whsec_`) and add it to your `.env` file

### For Production:
1. Go to **Stripe Dashboard > Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/subscriptions/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** and add it to your `.env` file

## Step 4: Recreate Subscription Plans with Stripe Integration

After configuring Stripe, you need to recreate your subscription plans so they get Stripe product and price IDs.

### Option A: Via Admin Dashboard
1. Log in as admin
2. Go to **Subscriptions** management
3. Delete existing plans (if they don't have Stripe IDs)
4. Create new plans - they will automatically be created in Stripe

### Option B: Via Database Script

Run this script to update existing plans with Stripe integration:

```bash
cd server
node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('./config/database');

async function setupPlans() {
  const [plans] = await pool.query('SELECT * FROM subscription_plans WHERE stripe_price_id IS NULL AND is_free = FALSE');
  
  for (const plan of plans) {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Create Stripe price
      const intervalMap = {
        'monthly': { interval: 'month', interval_count: 1 },
        'quarterly': { interval: 'month', interval_count: 3 },
        'yearly': { interval: 'year', interval_count: 1 }
      };
      
      const stripeInterval = intervalMap[plan.interval] || intervalMap['monthly'];
      
      const price = await stripe.prices.create({
        unit_amount: Math.round(parseFloat(plan.price) * 100),
        currency: 'usd',
        recurring: {
          interval: stripeInterval.interval,
          interval_count: stripeInterval.interval_count,
        },
        product: product.id,
      });
      
      // Update database
      await pool.query(
        'UPDATE subscription_plans SET stripe_product_id = ?, stripe_price_id = ? WHERE id = ?',
        [product.id, price.id, plan.id]
      );
      
      console.log(\`✅ Updated plan: \${plan.name} (ID: \${plan.id})\`);
    } catch (error) {
      console.error(\`❌ Error updating plan \${plan.name}:\`, error.message);
    }
  }
  
  console.log('\\n✅ All plans updated!');
  process.exit(0);
}

setupPlans();
"
```

## Step 5: Restart Your Server

After configuring environment variables:

```bash
cd server
npm start
```

## Step 6: Test the Payment Flow

1. **Navigate to**: http://localhost:3000/subscription/checkout
2. **Click "Subscribe Now"** on any paid plan
3. **You should be redirected to Stripe Checkout**
4. **Use Stripe test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Verification Checklist

- [ ] Stripe API keys added to `server/.env`
- [ ] Server restarted after adding keys
- [ ] Subscription plans have `stripe_price_id` in database
- [ ] Clicking "Subscribe Now" redirects to Stripe Checkout
- [ ] Test payment completes successfully
- [ ] User is redirected back to success page
- [ ] Subscription appears in user's account

## Troubleshooting

### Error: "Stripe is not configured"
- Check that `STRIPE_SECRET_KEY` is set in `server/.env`
- Restart the server after adding the key

### Error: "Plan is not configured for online payments"
- The plan doesn't have a `stripe_price_id`
- Run the database script in Step 4 to add Stripe IDs to existing plans
- Or delete and recreate the plans via admin dashboard

### Webhook not receiving events
- For local development, make sure Stripe CLI is running: `stripe listen --forward-to localhost:5000/api/subscriptions/webhook`
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint is accessible

### Payment succeeds but subscription not created
- Check server logs for errors
- Verify webhook is configured and receiving events
- Check database for subscription record

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Enable webhook signature verification** in production
4. **Use HTTPS** in production for webhook endpoints
5. **Regularly rotate** your API keys
6. **Monitor** Stripe Dashboard for suspicious activity

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

## Support

If you encounter issues:
1. Check Stripe Dashboard logs
2. Check server console logs
3. Verify all environment variables are set correctly
4. Ensure database schema is up to date
