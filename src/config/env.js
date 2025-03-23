/**
 * Environment Configuration
 * 
 * This file centralizes all environment variable access to make it easier
 * to manage configuration across the application.
 */

// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);

// Authentication
export const AUTH_TOKEN_NAME = process.env.REACT_APP_AUTH_TOKEN_NAME || 'token';
export const JWT_SECRET = process.env.REACT_APP_JWT_SECRET;

// Feature Flags
export const ENABLE_ANALYTICS = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
export const ENABLE_NOTIFICATIONS = process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false';
export const ENABLE_MOCK_ORDERS = process.env.REACT_APP_ENABLE_MOCK_ORDERS === 'true';

// Log mock orders setting for debugging
console.log(`ENABLE_MOCK_ORDERS is set to: ${ENABLE_MOCK_ORDERS} (NODE_ENV: ${process.env.NODE_ENV})`);

// Product Configuration
export const ITEMS_PER_PAGE = parseInt(process.env.REACT_APP_ITEMS_PER_PAGE || '12', 10);
export const MAX_PRICE_FILTER = parseInt(process.env.REACT_APP_MAX_PRICE_FILTER || '1000', 10);

// Environment Detection
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test';

/**
 * Get environment variable value with fallback
 * @param {string} key - Environment variable key
 * @param {*} fallback - Fallback value if environment variable is not set
 * @returns {string} - Environment variable value or fallback
 */
export const getEnvVar = (key, fallback = '') => {
  return process.env[`REACT_APP_${key}`] || fallback;
};

export default {
  API_URL,
  API_TIMEOUT,
  AUTH_TOKEN_NAME,
  JWT_SECRET,
  ENABLE_ANALYTICS,
  ENABLE_NOTIFICATIONS,
  ENABLE_MOCK_ORDERS,
  ITEMS_PER_PAGE,
  MAX_PRICE_FILTER,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  IS_TEST,
  getEnvVar
}; 