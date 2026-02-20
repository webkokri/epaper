const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes - Get active plans (no authentication required)
router.get('/plans/active', subscriptionController.getActivePlans);

// Protected routes - Require authentication
router.use(authMiddleware);

// Get current user's subscription
router.get('/my-subscription', subscriptionController.getUserSubscription);

// Check subscription status
router.get('/check-status', subscriptionController.checkSubscriptionStatus);

// Create checkout session (redirects to Stripe)
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// Create payment intent for embedded form (stays on site)
router.post('/create-payment-intent', subscriptionController.createPaymentIntent);

// Confirm subscription after payment
router.post('/confirm-subscription', subscriptionController.confirmSubscription);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Get payment history (user sees own, admin sees all)
router.get('/payments', subscriptionController.getPaymentHistory);

// Admin only routes
router.use(adminMiddleware);

// Payment gateway management (admin)
router.get('/stripe-status', subscriptionController.getStripeStatus);
router.get('/payment-stats', subscriptionController.getPaymentStats);
router.post('/test-stripe-connection', subscriptionController.testStripeConnection);
router.post('/update-config', subscriptionController.updateStripeConfig);

// Get all plans (admin) - MUST come before /plans/:id
router.get('/plans', subscriptionController.getAllPlans);

// Get plan by ID (admin)
router.get('/plans/:id', subscriptionController.getPlanById);

// Create new plan (admin)
router.post('/plans', subscriptionController.createPlan);

// Update plan (admin)
router.put('/plans/:id', subscriptionController.updatePlan);

// Toggle plan status (admin)
router.patch('/plans/:id/toggle', subscriptionController.togglePlanStatus);

// Delete plan (admin)
router.delete('/plans/:id', subscriptionController.deletePlan);

// Get all subscriptions (admin)
router.get('/all', subscriptionController.getAllSubscriptions);

module.exports = router;
