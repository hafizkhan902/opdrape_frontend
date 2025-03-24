import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { AUTH_TOKEN_NAME } from '../../config/env';
import Button from '../common/Button';
import './LoginForm.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for session expiry message
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reason = params.get('reason');
    
    if (reason === 'session_expired') {
      setSubmitError('Your session has expired. Please log in again.');
    }
  }, [location]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setSubmitError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
        remember: formData.rememberMe
      });
      
      // Store token in localStorage
      localStorage.setItem(AUTH_TOKEN_NAME, response.data.token);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update context with user data
      login(response.data.user);
      
      // Get return URL from query params or use default
      const params = new URLSearchParams(location.search);
      const returnUrl = params.get('returnUrl') || '/';
      
      // Redirect to return URL or home page
      navigate(returnUrl);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setSubmitError('Invalid email or password');
            break;
          case 422:
            if (error.response.data.errors) {
              const serverErrors = {};
              error.response.data.errors.forEach(err => {
                serverErrors[err.field] = err.message;
              });
              setErrors(serverErrors);
            } else {
              setSubmitError('Invalid login data');
            }
            break;
          case 429:
            setSubmitError('Too many login attempts. Please try again later.');
            break;
          default:
            setSubmitError(error.response.data.message || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        setSubmitError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setSubmitError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2 className="login-title">Sign In</h2>
        
        {submitError && (
          <div className="login-error" role="alert">
            {submitError}
          </div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              autoFocus
              disabled={loading}
            />
            {errors.email && (
              <span className="error-message" role="alert">
                {errors.email}
              </span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            {errors.password && (
              <span className="error-message" role="alert">
                {errors.password}
              </span>
            )}
          </div>
          
          <div className="form-group checkbox-group">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
          
          <Button
            type="submit"
            className="login-button"
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <div className="register-prompt">
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Create one now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm; 