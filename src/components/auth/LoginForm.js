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
  
  // Get return URL from query params
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') || '/';
  const reason = searchParams.get('reason');
  
  // Check for session expiry message
  useEffect(() => {
    if (reason === 'session_expired') {
      setSubmitError('Your session has expired. Please log in again.');
    }
  }, [reason]);
  
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
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitError('');
    setLoading(true);

    try {
      // Make the login request
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });

      // Store the token
      localStorage.setItem(AUTH_TOKEN_NAME, response.data.token);

      // Store user data
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));

      // Update app context with user data
      login(userData);

      // Check if user is admin and trying to access admin area
      const isAdmin = userData.isAdmin === true || userData.role === 'admin';
      
      if (isAdmin && returnUrl.startsWith('/admin')) {
        console.log("Login successful - Admin user, redirecting to admin area");
        navigate(returnUrl, { replace: true });
      } else {
        console.log("Login successful - Redirecting to:", returnUrl);
        navigate(returnUrl, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setSubmitError(err.response?.data?.message || 'Failed to log in. Please try again.');
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
            fullWidth 
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 