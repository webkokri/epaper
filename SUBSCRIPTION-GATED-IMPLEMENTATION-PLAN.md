# Subscription-Gated E-Paper Access Implementation Plan

## Information Gathered

### Current Implementation Analysis:

1. **Settings System** (`server/controllers/settingsController.js`):
   - `subscription_mode_enabled` setting controls subscription requirement
   - `checkSubscriptionMode` endpoint exists

2. **Frontend** (`src/layouts/front-page/index.js`):
   - Shows subscribe button for unauthenticated users
   - Shows subscription CTA for authenticated users without subscription
   - Shows first 3 e-papers as free preview
   - Redirects to subscription checkout when clicking locked content

3. **Backend** (`server/controllers/epaperController.js`):
   - `getEPaperById` - DOES NOT check subscription status
   - Anyone can access any e-paper by ID (SECURITY ISSUE)

4. **Subscription System**:
   - Plans, checkout, payment gateway already implemented
   - `checkSubscriptionStatus` endpoint exists

### Key Issues to Fix:
1. Backend doesn't enforce subscription check on e-paper access
2. Public viewer allows access without subscription verification

## Plan

### Phase 1: Backend Implementation

#### 1.1 Create Subscription Helper Middleware/Function
- Create `server/utils/subscriptionHelper.js` with:
  - Function to check subscription mode setting
  - Function to check user's subscription status
  - Function to determine if e-paper should be accessible

#### 1.2 Update E-Paper Controller (`server/controllers/epaperController.js`)
- Modify `getEPaperById` to:
  - Check if subscription mode is enabled
  - If enabled, verify user is authenticated
  - Check if user has active subscription
  - Return limited data (first 3 pages only) for non-subscribers
  - Return full access for subscribers

#### 1.3 Update E-Paper Routes (`server/routes/epapers.js`)
- Ensure auth middleware is properly applied for subscription-gated routes

### Phase 2: Frontend Updates

#### 2.1 Update Public Viewer (`src/layouts/epapers/public-viewer.js`)
- Add subscription check on mount
- Show locked state for non-subscribers
- Show subscribe button for unauthenticated users
- Display only first 3 pages for non-subscribers

#### 2.2 Update Front Page (`src/layouts/front-page/index.js`)
- Enhance subscription enforcement
- Improve messaging for non-subscribers

### Phase 3: Testing & Integration

#### 3.1 Test Scenarios
- Test as unauthenticated visitor (should see subscribe prompt)
- Test as authenticated non-subscriber (should see subscribe CTA)
- Test as subscriber (should have full access)
- Test subscription mode disabled (everyone can access)

## Dependent Files to be Edited

1. `server/controllers/epaperController.js` - Add subscription checks
2. `server/routes/epapers.js` - Ensure proper auth middleware
3. `src/layouts/epapers/public-viewer.js` - Add subscription enforcement
4. `src/layouts/front-page/index.js` - Enhance subscription UI

## Followup Steps

1. Test subscription mode enabled/disabled scenarios
2. Verify Stripe integration works correctly
3. Test free preview limit (first 3 pages)
4. Test payment flow end-to-end

## Notes

- The implementation assumes Stripe is configured
- Free preview (first 3 pages) will be implemented server-side for security
- Users must create account and subscribe to access full e-papers

