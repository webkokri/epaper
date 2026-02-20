const pool = require('../config/database');

/**
 * Subscription Helper Utilities
 * Provides functions to check subscription mode and user subscription status
 */

const FREE_PREVIEW_PAGES = 3; // Number of free pages for non-subscribers

/**
 * Check if subscription mode is enabled
 * @returns {Promise<boolean>} - Whether subscription mode is enabled
 */
exports.isSubscriptionModeEnabled = async () => {
  try {
    const [settings] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'subscription_mode_enabled'"
    );

    if (settings.length === 0) {
      return false;
    }

    return settings[0].setting_value === 'true';
  } catch (error) {
    console.error('Error checking subscription mode:', error);
    return false;
  }
};

/**
 * Check if user has an active subscription
 * @param {number} userId - The user ID to check
 * @returns {Promise<{hasActiveSubscription: boolean, isFreePlan: boolean, subscription: object|null}>}
 */
exports.checkUserSubscription = async (userId) => {
  try {
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

    return {
      hasActiveSubscription,
      isFreePlan,
      subscription: hasActiveSubscription ? subscriptions[0] : null
    };
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return {
      hasActiveSubscription: false,
      isFreePlan: false,
      subscription: null
    };
  }
};

/**
 * Check if user can access the full e-paper
 * @param {number|null} userId - The user ID (null if not authenticated)
 * @returns {Promise<{canAccess: boolean, isSubscriber: boolean, isFreePlan: boolean, pages: {allowed: number, total: number}>}
 */
exports.checkEPaperAccess = async (userId) => {
  // Check if subscription mode is enabled
  const subscriptionModeEnabled = await exports.isSubscriptionModeEnabled();

  // If subscription mode is disabled, everyone can access
  if (!subscriptionModeEnabled) {
    return {
      canAccess: true,
      isSubscriber: false,
      isFreePlan: false,
      accessType: 'open',
      pages: {
        allowed: -1, // Unlimited
        total: -1
      }
    };
  }

  // If no user ID (not authenticated), block access
  if (!userId) {
    return {
      canAccess: false,
      isSubscriber: false,
      isFreePlan: false,
      accessType: 'unauthenticated',
      pages: {
        allowed: 0,
        total: -1
      }
    };
  }

  // Check user's subscription status
  const subscription = await exports.checkUserSubscription(userId);

  if (!subscription.hasActiveSubscription) {
    return {
      canAccess: false,
      isSubscriber: false,
      isFreePlan: false,
      accessType: 'no_subscription',
      pages: {
        allowed: FREE_PREVIEW_PAGES,
        total: -1
      }
    };
  }

  // User has active subscription
  return {
    canAccess: true,
    isSubscriber: true,
    isFreePlan: subscription.isFreePlan,
    accessType: subscription.isFreePlan ? 'free_plan' : 'premium',
    pages: {
      allowed: -1, // Unlimited
      total: -1
    }
  };
};

/**
 * Get access info for e-paper (returns metadata without blocking)
 * @param {number|null} userId - The user ID (null if not authenticated)
 * @returns {Promise<Object>} - Access information
 */
exports.getEPaperAccessInfo = async (userId) => {
  return exports.checkEPaperAccess(userId);
};

/**
 * Filter pages based on subscription access
 * @param {Array} pages - Array of page objects
 * @param {number} allowedPages - Number of pages allowed (-1 for unlimited)
 * @returns {Array} - Filtered pages array
 */
exports.filterPagesByAccess = (pages, allowedPages) => {
  if (allowedPages === -1) {
    return pages;
  }
  return pages.slice(0, allowedPages);
};

module.exports = {
  isSubscriptionModeEnabled: exports.isSubscriptionModeEnabled,
  checkUserSubscription: exports.checkUserSubscription,
  checkEPaperAccess: exports.checkEPaperAccess,
  getEPaperAccessInfo: exports.getEPaperAccessInfo,
  filterPagesByAccess: exports.filterPagesByAccess,
  FREE_PREVIEW_PAGES
};

