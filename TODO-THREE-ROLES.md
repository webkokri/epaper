# Three-Role System Implementation TODO

## Backend Changes

### 1. server/middleware/auth.js
- [x] Add `publisherMiddleware` to check for publisher or admin roles
- [x] Update `adminMiddleware` to be more explicit
- [x] Add helper function to check if user is admin or publisher

### 2. server/controllers/authController.js
- [x] Update `register` function to ensure self-registered users get 'user' role
- [x] Update `createUser` to allow 'publisher' role creation by admin
- [x] Update `updateUserRole` to include 'publisher' in valid roles array
- [x] Update role validation message

### 3. server/routes/auth.js
- [x] Update role validation in create user route to include 'publisher'

## Frontend Changes

### 4. src/App.js
- [x] Create new `PublisherRoute` component for publisher+admin access
- [x] Update `PublicRoute` to NOT redirect regular users to dashboard
- [x] Update `ProtectedRoute` to check user roles
- [x] Update route handling logic

### 5. src/routes.js
- [x] Add `publisherOnly` flag for publisher-accessible routes
- [x] Update route configurations for proper role access

### 6. src/layouts/user-management/index.js
- [x] Add 'publisher' option in role dropdown
- [x] Update role display to show all three roles with different colors

### 7. src/layouts/authentication/sign-up/index.js
- [x] After successful registration, redirect regular users to front page instead of dashboard

### 8. src/context/AuthContext.js
- [x] Add helper functions: `isAdmin()`, `isPublisher()`, `canAccessDashboard()`

### 9. src/examples/Sidenav/index.js
- [x] Update to filter routes based on publisher role as well

### 10. src/layouts/front-page/index.js
- [x] Add user profile display for logged-in users
- [x] Add logout button for logged-in users
- [x] Show welcome message for logged-in users

## Testing Checklist

- [ ] Test admin can create publisher
- [ ] Test admin can create user
- [ ] Test regular user signup redirects to front page
- [ ] Test regular user cannot access /dashboard
- [ ] Test regular user can see profile on front page
- [ ] Test publisher can access publisher routes
- [ ] Test admin can access all routes
