# Three-Role System Implementation

## Overview

This document describes the implementation of a three-role access control system for the E-Paper Publishing Platform.

## Roles

### 1. **Admin**
- **Access**: Full access to all features
- **Can**: Create users with 'user' or 'publisher' roles, manage all content, access User Management
- **Created by**: Database seeding or manual database insertion

### 2. **Publisher**
- **Access**: Dashboard, E-Paper management, Categories, Upload, Edit
- **Can**: Create, edit, publish, and manage e-papers
- **Created by**: Admin via User Management panel

### 3. **User** (Regular User)
- **Access**: Front page only, can save favorites, view profile
- **Cannot**: Access dashboard, upload e-papers, manage categories, access admin panel
- **Created by**: Self-registration via Sign Up page

## Backend Implementation

### Middleware (`server/middleware/auth.js`)

```javascript
// publisherMiddleware - checks if user is admin or publisher
const publisherMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'publisher') {
    return res.status(403).json({ message: 'Access denied. Admin or Publisher only.' });
  }
  next();
};

// canAccessDashboard helper
const canAccessDashboard = (role) => {
  return role === 'admin' || role === 'publisher';
};
```

### Route Protection

| Route | Middleware | Access |
|-------|-----------|--------|
| `/api/dashboard/*` | `authMiddleware, publisherMiddleware` | Admin, Publisher |
| `/api/categories/*` | `authMiddleware, publisherMiddleware` | Admin, Publisher |
| `/api/epapers/*` (POST, PUT, DELETE) | `authMiddleware, publisherMiddleware` | Admin, Publisher |
| `/api/epapers/*` (GET) | Public | Everyone |
| `/api/auth/users` | `authMiddleware, adminMiddleware` | Admin only |

### User Registration (`server/controllers/authController.js`)

```javascript
// Self-registered users always get 'user' role
const register = async (req, res) => {
  // ...
  const token = generateToken({ id: result.insertId, email, role: 'user' });
  // ...
};

// Admin can create users with 'user' or 'publisher' role
const createUser = async (req, res) => {
  // Only admin can create users
  // Role can be 'user' or 'publisher'
};
```

## Frontend Implementation

### Route Components (`src/App.js`)

```javascript
// PublisherRoute - for admin and publisher only
const PublisherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/authentication/sign-in" replace />;
  if (!canAccessDashboard(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

// PublicRoute - redirects regular users to front page
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) return <Loading />;
  if (isAuthenticated && canAccessDashboard(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAuthenticated && !canAccessDashboard(user?.role)) {
    return <Navigate to="/" replace />; // Regular users go to front page
  }
  
  return children;
};
```

### Route Configuration (`src/routes.js`)

```javascript
{
  type: "collapse",
  name: "Dashboard",
  key: "dashboard",
  route: "/dashboard",
  component: <Dashboard />,
  requiresAuth: true,
  publisherOnly: true,  // Only admin and publisher
},
{
  type: "collapse",
  name: "User Management",
  key: "user-management",
  route: "/admin/users",
  component: <UserManagement />,
  requiresAuth: true,
  adminOnly: true,  // Only admin
}
```

### Auth Context Helpers (`src/context/AuthContext.js`)

```javascript
const value = {
  user,
  isAuthenticated,
  loading,
  isAdmin: user?.role === 'admin',
  isPublisher: user?.role === 'publisher',
  canAccessDashboard: user?.role === 'admin' || user?.role === 'publisher',
  // ...
};
```

### Sign Up Redirect (`src/layouts/authentication/sign-up/index.js`)

```javascript
const handleSubmit = async (e) => {
  // ...
  if (result.success) {
    // Regular users go to front page, not dashboard
    if (result.user?.role === 'user') {
      navigate("/");
    } else {
      navigate("/dashboard");
    }
  }
  // ...
};
```

### User Management (`src/layouts/user-management/index.js`)

- **Create Mode**: Admin can select 'user' or 'publisher' role
- **Edit Mode**: Admin can change role to 'user', 'publisher', or 'admin'

## Testing Results

### Regular User (role: 'user')
```
✅ Registration: Creates 'user' role by default
✅ Dashboard API: 403 Forbidden
✅ Categories API: 403 Forbidden
✅ User Management API: 403 Forbidden
✅ Redirect: Goes to front page after login/signup
```

### Publisher (role: 'publisher')
```
✅ Dashboard API: Accessible
✅ Categories API: Accessible
✅ E-Paper Management: Accessible
✅ User Management: 403 Forbidden (admin only)
```

### Admin (role: 'admin')
```
✅ Full access to all features
✅ Can create users with 'user' or 'publisher' roles
✅ Can promote users to any role
```

## Database Schema

No schema changes required. The existing `role` column in the `users` table supports all three roles:

```sql
role VARCHAR(50) DEFAULT 'user'
```

Valid values: `'admin'`, `'publisher'`, `'user'`

## Security Considerations

1. **Backend Validation**: All role checks are performed on the backend, not just frontend
2. **Token Validation**: JWT tokens include role information and are verified on every request
3. **Route Protection**: Each API route has appropriate middleware protection
4. **Self-Registration**: Users can only register as 'user' role, never as 'admin' or 'publisher'

## Future Enhancements

- Add role-based UI elements (hide buttons/actions based on role)
- Add audit logging for admin actions
- Implement role-based permissions for specific features
- Add ability to deactivate/suspend users

## Files Modified

### Backend
- `server/middleware/auth.js` - Added publisherMiddleware
- `server/controllers/authController.js` - Updated role validation
- `server/routes/dashboard.js` - Added publisherMiddleware
- `server/routes/categories.js` - Added publisherMiddleware
- `server/routes/epapers.js` - Added publisherMiddleware

### Frontend
- `src/App.js` - Added PublisherRoute, updated redirects
- `src/routes.js` - Added publisherOnly flags
- `src/context/AuthContext.js` - Added role helpers
- `src/layouts/authentication/sign-up/index.js` - Updated redirect logic
- `src/layouts/authentication/sign-in/index.js` - Updated redirect logic
- `src/layouts/user-management/index.js` - Added publisher role option
- `src/examples/Sidenav/index.js` - Updated route filtering
- `src/layouts/front-page/index.js` - Added user profile display
