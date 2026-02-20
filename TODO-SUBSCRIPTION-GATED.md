# Subscription-Gated E-Paper Implementation TODO

## Phase 1: Backend Implementation
- [x] 1.1 Create subscription helper utility (`server/utils/subscriptionHelper.js`)
- [x] 1.2 Update E-Paper Controller (`server/controllers/epaperController.js`) - Add subscription checks to getEPaperById
- [x] 1.3 Update E-Paper Routes (`server/routes/epapers.js`) - Ensure proper auth middleware

## Phase 2: Frontend Updates
- [x] 2.1 Update Public Viewer (`src/layouts/epapers/public-viewer.js`) - Add subscription enforcement
- [x] 2.2 Update API service (`src/services/api.js`) - Include auth token for subscription check

## Phase 3: Testing & Integration
- [ ] 3.1 Test subscription mode enabled/disabled scenarios
- [ ] 3.2 Verify Stripe integration works correctly
- [ ] 3.3 Test free preview limit (first 3 pages)
- [ ] 3.4 Test payment flow end-to-end

## Implementation Complete

### Changes Made:
1. **Server - Subscription Helper** (`server/utils/subscriptionHelper.js`)
   - Added functions to check subscription mode and user subscription status
   - Returns access info with page limits

2. **Server - E-Paper Controller** (`server/controllers/epaperController.js`)
   - Modified `getEPaperById` to check subscription access
   - Returns limited pages (3) for non-subscribers
   - Returns full access for subscribers

3. **Frontend - API Service** (`src/services/api.js`)
   - Updated `getById` to include auth token when available

4. **Frontend - Public Viewer** (`src/layouts/epapers/public-viewer.js`)
   - Added subscription alert banner
   - Shows login/signup or subscribe buttons based on user status
   - Shows limited pages info
   - Hides crop/share for non-subscribers

### How It Works:
1. When subscription mode is enabled (in admin settings):
   - Unauthenticated users: See login/signup prompt
   - Authenticated non-subscribers: See subscribe CTA, get 3 free pages
   - Subscribers: Full access to all pages

2. When subscription mode is disabled:
   - Everyone has full access (open access)

