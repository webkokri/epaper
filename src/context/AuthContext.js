import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, subscriptionAPI } from 'services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        // Check subscription status after auth
        await checkSubscriptionStatus();
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.checkSubscriptionStatus();
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({ hasActiveSubscription: false });
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      // Check subscription status after login
      await checkSubscriptionStatus();
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      // Check subscription status after registration
      await checkSubscriptionStatus();
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setSubscriptionStatus(null);
  };

  // Helper functions for role checking
  const isAdmin = () => user?.role === 'admin';
  const isPublisher = () => user?.role === 'publisher';
  const isRegularUser = () => user?.role === 'user';
  const canAccessDashboard = () => user?.role === 'admin' || user?.role === 'publisher';
  
  // Check if user has active subscription
  const hasActiveSubscription = () => subscriptionStatus?.hasActiveSubscription || false;

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isPublisher,
    isRegularUser,
    canAccessDashboard,
    subscriptionStatus,
    checkSubscriptionStatus,
    hasActiveSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
