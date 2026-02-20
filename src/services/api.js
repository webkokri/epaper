import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/authentication/sign-in';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  // Admin user management
  getAllUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUserRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Authors API
export const authorsAPI = {
  getAll: () => api.get('/authors'),
  getById: (id) => api.get(`/authors/${id}`),
  create: (data) => api.post('/authors', data),
  update: (id, data) => api.put(`/authors/${id}`, data),
  delete: (id) => api.delete(`/authors/${id}`),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Create public API instance (no auth redirect on 401)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// E-Papers API
export const epaperAPI = {
  getAll: () => publicApi.get('/epapers'),
  getById: (id) => {
    // Get token from localStorage if available to check subscription status
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return publicApi.get(`/epapers/${id}`, config);
  },
  create: (formData) => {
    return api.post('/epapers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.put(`/epapers/${id}`, data),
  delete: (id) => api.delete(`/epapers/${id}`),
  publish: (id) => api.post(`/epapers/${id}/publish`),
  cropAndShare: (data) => api.post('/epapers/crop-share', data),
  getSharedCrop: (token) => api.get(`/epapers/share/${token}`),
};

// Area Maps API
export const areaMapAPI = {
  getByEPaper: (ePaperId) => api.get(`/areamaps/e-paper/${ePaperId}`),
  getByPage: (pageId) => api.get(`/areamaps/page/${pageId}`),
  create: (data) => api.post('/areamaps', data),
  createBatch: (areas) => api.post('/areamaps/batch', { areas }),
  update: (id, data) => api.put(`/areamaps/${id}`, data),
  delete: (id) => api.delete(`/areamaps/${id}`),
  getStats: (ePaperId) => api.get(`/areamaps/stats/${ePaperId}`),
  testPoint: (pageId, x, y) => api.post(`/areamaps/test-point/${pageId}`, { x, y }),
};

// Advertisements API
export const advertisementAPI = {
  getAll: () => api.get('/advertisements'),
  getById: (id) => api.get(`/advertisements/${id}`),
  create: (formData) => {
    return api.post('/advertisements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, formData) => {
    return api.put(`/advertisements/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/advertisements/${id}`),
  getStats: (id) => api.get(`/advertisements/${id}/stats`),
  recordImpression: (id) => api.post(`/advertisements/${id}/impression`),
  recordClick: (id) => api.post(`/advertisements/${id}/click`),
  placeAd: (data) => api.post('/advertisements/place', data),
  removePlacement: (placementId) => api.delete(`/advertisements/placement/${placementId}`),
  getActiveAds: (ePaperId) => api.get(`/advertisements/e-paper/${ePaperId}/active`),
};

// Subscriptions API
export const subscriptionAPI = {
  // Public routes
  getActivePlans: () => publicApi.get('/subscriptions/plans/active'),
  
  // Protected routes
  getMySubscription: () => api.get('/subscriptions/my-subscription'),
  checkSubscriptionStatus: () => api.get('/subscriptions/check-status'),
  createCheckoutSession: (planId) => api.post('/subscriptions/create-checkout-session', { planId }),
  createPaymentIntent: (planId) => api.post('/subscriptions/create-payment-intent', { planId }),
  confirmSubscription: (paymentIntentId, planId) => api.post('/subscriptions/confirm-subscription', { paymentIntentId, planId }),
  cancelSubscription: () => api.post('/subscriptions/cancel'),
  getPaymentHistory: () => api.get('/subscriptions/payments'),
  
  // Admin routes
  getAllPlans: () => api.get('/subscriptions/plans'),
  getPlanById: (id) => api.get(`/subscriptions/plans/${id}`),
  createPlan: (data) => api.post('/subscriptions/plans', data),
  updatePlan: (id, data) => api.put(`/subscriptions/plans/${id}`, data),
  togglePlanStatus: (id, isActive) => api.patch(`/subscriptions/plans/${id}/toggle`, { is_active: isActive }),
  deletePlan: (id) => api.delete(`/subscriptions/plans/${id}`),
  getAllSubscriptions: () => api.get('/subscriptions/all'),
};

// Settings API
export const settingsAPI = {
  // Public routes
  getPublicSettings: () => publicApi.get('/settings/public'),
  checkSubscriptionMode: () => publicApi.get('/settings/subscription-mode'),
  
  // Admin routes
  getAllSettings: () => api.get('/settings'),
  getSettingByKey: (key) => api.get(`/settings/${key}`),
  createSetting: (data) => api.post('/settings', data),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  updateMultipleSettings: (settings) => api.put('/settings', { settings }),
  deleteSetting: (key) => api.delete(`/settings/${key}`),
  
  // Logo upload
  uploadLogo: (formData) => {
    return api.post('/settings/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Test email
  sendTestEmail: (to) => api.post('/settings/test-email', { to }),
};

export { API_URL };

export default api;
