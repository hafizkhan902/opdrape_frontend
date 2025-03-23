// Import env first
import env from './env';

// Re-export everything from env.js
export * from './env';

// Set default configs here with proper fallbacks
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const AUTH_TOKEN_NAME = process.env.REACT_APP_AUTH_TOKEN_NAME || 'token';
export const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);
export const ENABLE_MOCK_ORDERS = process.env.REACT_APP_ENABLE_MOCK_ORDERS === 'true';

// Default export
export default env; 