require('dotenv').config();
const pool = require('./config/database');

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripePlans() {
  try {
    console.log('🚀 Starting Stripe plans setup...\n');

    // Get all plans without Stripe IDs
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE stripe_price_id IS NULL AND is_free = FALSE AND is_active = TRUE'
    );

    if (plans.length === 0) {
      console.log('✅ All plans already have Stripe integration!');
      process.exit(0);
    }

    console.log(`Found ${plans.length} plan(s) to set up:\n`);

    for (const plan of plans) {
      try {
        console.log(`📦 Processing: ${plan.name} ($${plan.price}/${plan.interval})`);

        // Create Stripe product
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description || `${plan.name} subscription plan`,
        });
        console.log(`  ✓ Created Stripe product: ${product.id}`);

        // Map interval to Stripe format
        const intervalMap = {
          'monthly': { interval: 'month', interval_count: 1 },
          'quarterly': { interval: 'month', interval_count: 3 },
          'yearly': { interval: 'year', interval_count: 1 }
        };

        const stripeInterval = intervalMap[plan.interval] || intervalMap['monthly'];

        // Create Stripe price
        const price = await stripe.prices.create({
          unit_amount: Math.round(parseFloat(plan.price) * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: stripeInterval.interval,
            interval_count: stripeInterval.interval_count,
          },
          product: product.id,
        });
        console.log(`  ✓ Created Stripe price: ${price.id}`);

        // Update database
        await pool.query(
          'UPDATE subscription_plans SET stripe_product_id = ?, stripe_price_id = ? WHERE id = ?',
          [product.id, price.id, plan.id]
        );
        console.log(`  ✓ Updated database for plan ID: ${plan.id}\n`);

      } catch (error) {
        console.error(`  ❌ Error setting up plan "${plan.name}":`, error.message);
      }
    }

    console.log('\n✅ Stripe plans setup completed!');
    console.log('\n📋 Verifying setup...\n');

    // Verify all plans
    const [updatedPlans] = await pool.query(
      'SELECT id, name, price, `interval`, stripe_product_id, stripe_price_id FROM subscription_plans WHERE is_active = TRUE'
    );

    console.log('Active Plans Status:');
    updatedPlans.forEach(plan => {
      const status = plan.stripe_price_id ? '✅' : '❌';
      console.log(`${status} ${plan.name} - $${plan.price}/${plan.interval}`);
      if (plan.stripe_price_id) {
        console.log(`   Product: ${plan.stripe_product_id}`);
        console.log(`   Price: ${plan.stripe_price_id}`);
      }
    });

    console.log('\n🎉 Setup complete! You can now accept subscription payments.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupStripePlans();
