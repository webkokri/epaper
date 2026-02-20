const pool = require('../config/database');

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not configured. Stripe features will be disabled.');
}

// Get all subscription plans (admin only)
exports.getAllPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(`
      SELECT * FROM subscription_plans
      ORDER BY price ASC, created_at DESC
    `);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Error fetching subscription plans', error: error.message });
  }
};

// Get active subscription plans (public)
exports.getActivePlans = async (req, res) => {
  try {
    const [plans] = await pool.query(`
      SELECT id, name, description, price, \`interval\`, is_free, features
      FROM subscription_plans
      WHERE is_active = TRUE
      ORDER BY price ASC
    `);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching active plans:', error);
    res.status(500).json({ message: 'Error fetching active plans', error: error.message });
  }
};

// Get plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json(plans[0]);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ message: 'Error fetching plan', error: error.message });
  }
};

// Create new subscription plan (admin only)
exports.createPlan = async (req, res) => {
  try {
    const { name, description, price, interval, is_free, features } = req.body;

    // Check if plan name already exists
    const [existing] = await pool.query(
      'SELECT id FROM subscription_plans WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Plan name already exists' });
    }

    let stripeProductId = null;
    let stripePriceId = null;

    // Create Stripe product and price if not free and Stripe is configured
    if (!is_free && price > 0 && stripe) {
      try {
        // Create product in Stripe
        const product = await stripe.products.create({
          name: name,
          description: description,
        });
        stripeProductId = product.id;

        // Create price in Stripe
        const intervalMap = {
          'monthly': { interval: 'month', interval_count: 1 },
          'quarterly': { interval: 'month', interval_count: 3 },
          'yearly': { interval: 'year', interval_count: 1 }
        };

        const stripeInterval = intervalMap[interval] || intervalMap['monthly'];
        
        const priceObj = await stripe.prices.create({
          unit_amount: Math.round(price * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: stripeInterval.interval,
            interval_count: stripeInterval.interval_count,
          },
          product: product.id,
        });
        stripePriceId = priceObj.id;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return res.status(500).json({ message: 'Error creating Stripe product/price', error: stripeError.message });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO subscription_plans 
       (name, description, price, \`interval\`, stripe_price_id, stripe_product_id, is_free, features) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, interval, stripePriceId, stripeProductId, is_free || false, JSON.stringify(features || [])]
    );

    res.status(201).json({
      message: 'Subscription plan created successfully',
      id: result.insertId,
      stripe_price_id: stripePriceId,
      stripe_product_id: stripeProductId
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Error creating subscription plan', error: error.message });
  }
};

// Update subscription plan (admin only)
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, interval, is_free, features, is_active } = req.body;

    // Check if plan exists
    const [existing] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = existing[0];

    // If plan has active subscriptions, prevent certain changes
    const [activeSubs] = await pool.query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = "active"',
      [id]
    );

    if (activeSubs[0].count > 0 && (price !== plan.price || interval !== plan.interval)) {
      return res.status(400).json({ 
        message: 'Cannot modify price or interval of plan with active subscriptions. Create a new plan instead.' 
      });
    }

    // Update Stripe product if exists and Stripe is configured
    if (plan.stripe_product_id && !is_free && stripe) {
      try {
        await stripe.products.update(plan.stripe_product_id, {
          name: name || plan.name,
          description: description || plan.description,
        });
      } catch (stripeError) {
        console.error('Stripe update error:', stripeError);
      }
    }

    await pool.query(
      `UPDATE subscription_plans 
       SET name = ?, description = ?, price = ?, \`interval\` = ?, 
           is_free = ?, features = ?, is_active = ?
       WHERE id = ?`,
      [
        name || plan.name, 
        description || plan.description, 
        price !== undefined ? price : plan.price, 
        interval || plan.interval,
        is_free !== undefined ? is_free : plan.is_free,
        JSON.stringify(features || JSON.parse(plan.features || '[]')),
        is_active !== undefined ? is_active : plan.is_active,
        id
      ]
    );

    res.json({ message: 'Subscription plan updated successfully' });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ message: 'Error updating subscription plan', error: error.message });
  }
};

// Toggle plan status (enable/disable)
exports.togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    await pool.query(
      'UPDATE subscription_plans SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    res.json({ 
      message: `Subscription plan ${is_active ? 'enabled' : 'disabled'} successfully`,
      is_active 
    });
  } catch (error) {
    console.error('Error toggling plan status:', error);
    res.status(500).json({ message: 'Error toggling plan status', error: error.message });
  }
};

// Delete subscription plan (admin only)
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plan has any subscriptions
    const [usage] = await pool.query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ?',
      [id]
    );

    if (usage[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete plan that has subscriptions. Disable it instead.'
      });
    }

    // Get plan details to delete from Stripe
    const [plan] = await pool.query(
      'SELECT stripe_product_id, stripe_price_id FROM subscription_plans WHERE id = ?',
      [id]
    );

    // Archive in Stripe if exists and Stripe is configured
    if (plan.length > 0 && plan[0].stripe_product_id && stripe) {
      try {
        await stripe.products.update(plan[0].stripe_product_id, { active: false });
      } catch (stripeError) {
        console.error('Stripe archive error:', stripeError);
      }
    }

    await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ message: 'Error deleting subscription plan', error: error.message });
  }
};

// Get all subscriptions (admin only)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email, p.name as plan_name, p.price as plan_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN subscription_plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
    `);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

// Get current user's subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const [subscriptions] = await pool.query(`
      SELECT s.*, p.name as plan_name, p.price as plan_price, p.\`interval\`, p.is_free, p.features
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (subscriptions.length === 0) {
      return res.json({ hasSubscription: false });
    }

    res.json({
      hasSubscription: true,
      subscription: subscriptions[0]
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ message: 'Error fetching user subscription', error: error.message });
  }
};

// Check if user has active subscription
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [subscriptions] = await pool.query(`
      SELECT s.*, p.name as plan_name, p.is_free
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    const hasActiveSubscription = subscriptions.length > 0;
    const isFreePlan = hasActiveSubscription && subscriptions[0].is_free;

    res.json({
      hasActiveSubscription,
      isFreePlan,
      subscription: hasActiveSubscription ? subscriptions[0] : null
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Error checking subscription status', error: error.message });
  }
};

// Create checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' });
    }

    const { planId } = req.body;
    const userId = req.user.id;

    // Get plan details
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    const plan = plans[0];

    // Check if it's a free plan
    if (plan.is_free || parseFloat(plan.price) === 0) {
      return res.status(400).json({ message: 'Free plans do not require payment. Please contact support to activate your free subscription.' });
    }

    // Check if plan has a Stripe price ID
    if (!plan.stripe_price_id) {
      return res.status(400).json({ message: 'This plan is not configured for online payments. Please contact the administrator to set up Stripe integration for this plan.' });
    }

    // Check if user already has an active subscription
    const [existingSubs] = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status IN ("active", "trialing")',
      [userId]
    );

    if (existingSubs.length > 0) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    // Get user details
    const [users] = await pool.query(
      'SELECT email, name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Create or get Stripe customer
    let customerId;
    const [existingCustomer] = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
      [userId]
    );

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString()
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString()
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active subscription
    const [subscriptions] = await pool.query(`
      SELECT s.* FROM subscriptions s
      WHERE s.user_id = ? AND s.status = 'active' AND s.stripe_subscription_id IS NOT NULL
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = subscriptions[0];

    // Cancel in Stripe if configured
    if (stripe && subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error('Stripe cancel error:', stripeError);
        return res.status(500).json({ message: 'Error canceling subscription in Stripe', error: stripeError.message });
      }
    }

    // Update local database
    await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = TRUE WHERE id = ?',
      [subscription.id]
    );

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Error canceling subscription', error: error.message });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = `
      SELECT ph.*, u.name as user_name, u.email as user_email, p.name as plan_name
      FROM payment_history ph
      JOIN users u ON ph.user_id = u.id
      LEFT JOIN subscription_plans p ON ph.subscription_id = p.id
    `;
    
    let params = [];
    
    if (!isAdmin) {
      query += ' WHERE ph.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY ph.created_at DESC';

    const [payments] = await pool.query(query, params);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

// Get Stripe connection status
exports.getStripeStatus = async (req, res) => {
  try {
    const isConfigured = !!process.env.STRIPE_SECRET_KEY;
    let connected = false;
    let webhookConfigured = false;

    if (isConfigured && stripe) {
      try {
        // Test Stripe connection
        await stripe.balance.retrieve();
        connected = true;
      } catch (stripeError) {
        console.error('Stripe connection test failed:', stripeError);
      }
    }

    // Check if webhook secret is configured
    webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;

    res.json({
      connected,
      isConfigured,
      webhookConfigured,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test'
    });
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    res.status(500).json({ message: 'Error checking Stripe status', error: error.message });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    // Get total revenue
    const [revenueResult] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payment_history 
      WHERE status = 'succeeded'
    `);

    // Get transaction counts
    const [transactionsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM payment_history
    `);

    // Get active subscriptions count
    const [subscriptionsResult] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE status IN ('active', 'trialing')
    `);

    res.json({
      totalRevenue: parseFloat(revenueResult[0].total) || 0,
      totalTransactions: transactionsResult[0].total || 0,
      successfulPayments: parseInt(transactionsResult[0].successful) || 0,
      failedPayments: parseInt(transactionsResult[0].failed) || 0,
      activeSubscriptions: subscriptionsResult[0].count || 0
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Error fetching payment stats', error: error.message });
  }
};

// Test Stripe connection
exports.testStripeConnection = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return res.status(400).json({ success: false, message: 'Stripe secret key not configured' });
    }

    // Test by retrieving balance
    const balance = await stripe.balance.retrieve();
    
    res.json({ 
      success: true, 
      message: 'Stripe connection successful',
      balance: {
        available: balance.available,
        pending: balance.pending
      }
    });
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Stripe connection failed', 
      error: error.message 
    });
  }
};

// Update Stripe configuration (admin only)
exports.updateStripeConfig = async (req, res) => {
  try {
    const { stripe_secret_key, stripe_publishable_key, stripe_webhook_secret } = req.body;

    // In a production environment, you would save these to a secure database
    // For now, we'll just validate the keys format
    const secretKeyValid = stripe_secret_key?.match(/^sk_(test|live)_[a-zA-Z0-9]+$/);
    const publishableKeyValid = stripe_publishable_key?.match(/^pk_(test|live)_[a-zA-Z0-9]+$/);
    const webhookSecretValid = !stripe_webhook_secret || stripe_webhook_secret?.match(/^whsec_[a-zA-Z0-9]+$/);

    if (!secretKeyValid) {
      return res.status(400).json({ message: 'Invalid secret key format' });
    }

    if (!publishableKeyValid) {
      return res.status(400).json({ message: 'Invalid publishable key format' });
    }

    if (!webhookSecretValid) {
      return res.status(400).json({ message: 'Invalid webhook secret format' });
    }

    // Note: In production, save to database or secure config store
    // For development, these should be set in environment variables
    
    res.json({ 
      message: 'Configuration validated successfully. Please update your environment variables.',
      keys: {
        secretKeyValid: !!secretKeyValid,
        publishableKeyValid: !!publishableKeyValid,
        webhookSecretValid: !!webhookSecretValid
      }
    });
  } catch (error) {
    console.error('Error updating Stripe config:', error);
    res.status(500).json({ message: 'Error updating configuration', error: error.message });
  }
};

// Create payment intent for embedded form
exports.createPaymentIntent = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' });
    }

    const { planId } = req.body;
    const userId = req.user.id;

    // Get plan details
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    const plan = plans[0];

    // Check if it's a free plan
    if (plan.is_free || parseFloat(plan.price) === 0) {
      return res.status(400).json({ message: 'Free plans do not require payment.' });
    }

    // Check minimum amount (Stripe requires at least 50 cents)
    const planPrice = parseFloat(plan.price);
    if (planPrice < 0.50) {
      return res.status(400).json({ 
        message: `Plan price ($${planPrice.toFixed(2)}) is below Stripe's minimum of $0.50. Please update the plan price or contact support.` 
      });
    }

    // Check if plan has a Stripe price ID
    if (!plan.stripe_price_id) {
      return res.status(400).json({ message: 'This plan is not configured for online payments.' });
    }

    // Check if user already has an active subscription
    const [existingSubs] = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status IN ("active", "trialing")',
      [userId]
    );

    if (existingSubs.length > 0) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    // Get user details
    const [users] = await pool.query(
      'SELECT email, name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Create or get Stripe customer
    let customerId;
    const [existingCustomer] = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
      [userId]
    );

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString()
        }
      });
      customerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(plan.price) * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      setup_future_usage: 'off_session', // For future recurring payments
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        planName: plan.name
      },
      description: `Subscription to ${plan.name} plan`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customerId,
      planId: planId,
      planName: plan.name,
      amount: plan.price
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent', error: error.message });
  }
};

// Confirm subscription after successful payment
exports.confirmSubscription = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ message: 'Stripe is not configured.' });
    }

    const { paymentIntentId, planId } = req.body;
    const userId = req.user.id;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.userId !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get plan details
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = plans[0];

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer,
      items: [{ price: plan.stripe_price_id }],
      metadata: {
        userId: userId.toString(),
        planId: planId.toString()
      }
    });

    // Create subscription record in database
    const [result] = await pool.query(
      `INSERT INTO subscriptions 
       (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, 
        current_period_start, current_period_end) 
       VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`,
      [
        userId,
        planId,
        subscription.id,
        subscription.customer,
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end
      ]
    );

    const subscriptionId = result.insertId;

    // Record payment in payment history
    await pool.query(
      `INSERT INTO payment_history 
       (user_id, subscription_id, stripe_payment_intent_id, amount, currency, status, payment_method, description) 
       VALUES (?, ?, ?, ?, ?, 'succeeded', 'card', ?)`,
      [
        userId,
        subscriptionId,
        paymentIntentId,
        parseFloat(plan.price),
        'USD',
        `Initial payment for ${plan.name} subscription`
      ]
    );

    res.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscriptionId,
        plan_name: plan.name,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ message: 'Error confirming subscription', error: error.message });
  }
};

// Handle Stripe webhook
exports.handleWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ message: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Create subscription record
      const userId = parseInt(session.metadata.userId);
      const planId = parseInt(session.metadata.planId);
      
      try {
        // Get subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await pool.query(
          `INSERT INTO subscriptions 
           (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, 
            current_period_start, current_period_end) 
           VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`,
          [
            userId,
            planId,
            stripeSubscription.id,
            stripeSubscription.customer,
            stripeSubscription.status,
            stripeSubscription.current_period_start,
            stripeSubscription.current_period_end
          ]
        );

        // Record payment
        await pool.query(
          `INSERT INTO payment_history 
           (user_id, subscription_id, stripe_payment_intent_id, stripe_invoice_id, 
            amount, currency, status, payment_method, description) 
           VALUES (?, LAST_INSERT_ID(), ?, ?, ?, ?, 'succeeded', ?, ?)`,
          [
            userId,
            session.payment_intent,
            stripeSubscription.latest_invoice,
            session.amount_total / 100,
            session.currency.toUpperCase(),
            'card',
            `Subscription payment for plan ${planId}`
          ]
        );
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      
      try {
        // Update subscription period
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        await pool.query(
          `UPDATE subscriptions 
           SET current_period_start = FROM_UNIXTIME(?), 
               current_period_end = FROM_UNIXTIME(?),
               status = ?
           WHERE stripe_subscription_id = ?`,
          [
            stripeSubscription.current_period_start,
            stripeSubscription.current_period_end,
            stripeSubscription.status,
            invoice.subscription
          ]
        );

        // Record payment
        const [sub] = await pool.query(
          'SELECT id, user_id FROM subscriptions WHERE stripe_subscription_id = ?',
          [invoice.subscription]
        );

        if (sub.length > 0) {
          await pool.query(
            `INSERT INTO payment_history 
             (user_id, subscription_id, stripe_invoice_id, amount, currency, status, description) 
             VALUES (?, ?, ?, ?, ?, 'succeeded', ?)`,
            [
              sub[0].user_id,
              sub[0].id,
              invoice.id,
              invoice.amount_paid / 100,
              invoice.currency.toUpperCase(),
              'Recurring subscription payment'
            ]
          );
        }
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      
      try {
        await pool.query(
          'UPDATE subscriptions SET status = "past_due" WHERE stripe_subscription_id = ?',
          [invoice.subscription]
        );

        // Record failed payment
        const [sub] = await pool.query(
          'SELECT id, user_id FROM subscriptions WHERE stripe_subscription_id = ?',
          [invoice.subscription]
        );

        if (sub.length > 0) {
          await pool.query(
            `INSERT INTO payment_history 
             (user_id, subscription_id, stripe_invoice_id, amount, currency, status, description) 
             VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
            [
              sub[0].user_id,
              sub[0].id,
              invoice.id,
              invoice.amount_due / 100,
              invoice.currency.toUpperCase(),
              'Failed subscription payment'
            ]
          );
        }
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      try {
        await pool.query(
          `UPDATE subscriptions 
           SET status = 'canceled', 
               canceled_at = NOW(),
               cancel_at_period_end = FALSE
           WHERE stripe_subscription_id = ?`,
          [subscription.id]
        );
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      
      try {
        await pool.query(
          `UPDATE subscriptions 
           SET status = ?,
               current_period_start = FROM_UNIXTIME(?),
               current_period_end = FROM_UNIXTIME(?),
               cancel_at_period_end = ?
           WHERE stripe_subscription_id = ?`,
          [
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            subscription.cancel_at_period_end,
            subscription.id
          ]
        );
      } catch (dbError) {
        console.error('Database error in webhook:', dbError);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
