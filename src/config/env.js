/**
 * Environment Configuration
 * 
 * This file centralizes all environment variable access to make it easier
 * to manage configuration across the application.
 */

// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'https://opdrape-backend.onrender.com/api';
export const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);

// Authentication
export const AUTH_TOKEN_NAME = process.env.REACT_APP_AUTH_TOKEN_NAME || 'token';
export const JWT_SECRET = process.env.REACT_APP_JWT_SECRET;

// Environment detection
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

// Feature Flags
export const ENABLE_ANALYTICS = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
export const ENABLE_NOTIFICATIONS = process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false';
export const ENABLE_MOCK_ORDERS = process.env.REACT_APP_ENABLE_MOCK_ORDERS === 'true' && !IS_PRODUCTION;

// Product Configuration
export const ITEMS_PER_PAGE = parseInt(process.env.REACT_APP_ITEMS_PER_PAGE || '12', 10);
export const MAX_PRICE_FILTER = parseInt(process.env.REACT_APP_MAX_PRICE_FILTER || '1000', 10);

// Export helper functions
export const getEnvVar = (key, fallback = '') => {
  return process.env[`REACT_APP_${key}`] || fallback;
};

// Create a configuration object
const config = {
  API_URL,
  API_TIMEOUT,
  AUTH_TOKEN_NAME,
  JWT_SECRET,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  ENABLE_ANALYTICS,
  ENABLE_NOTIFICATIONS,
  ENABLE_MOCK_ORDERS,
  ITEMS_PER_PAGE,
  MAX_PRICE_FILTER,
  getEnvVar,
};

// Export the configuration object
export default config;