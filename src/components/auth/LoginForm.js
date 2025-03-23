import React, { useState } from 'react';
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to homepage
  const redirectPath = location.state?.from || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(formData);
      
      // Store token in localStorage
      localStorage.setItem(AUTH_TOKEN_NAME, response.data.token);
      
      // Check for admin credentials for testing purposes
      // In a real app, this would come from the server
      const userData = response.data.user || {};
      
      // Set isAdmin flag for testing - in a real app this would be set by the backend
      // Admin test email: admin@example.com, password: admin123
      if (formData.email === 'admin@example.com' && formData.password === 'admin123') {
        userData.isAdmin = true;
        console.log('Admin user detected - granting admin privileges for testing');
      } else {
        userData.isAdmin = false;
      }
      
      // Store user data with admin flag if remember me is checked or in sessionStorage if not
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Update app context with user data including admin flag
      login(userData);
      
      // Redirect to previous page or homepage
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2 className="login-title">Log In to Your Account</h2>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            disabled={loading}
          >
            Log In
          </Button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
          <div className="admin-test-note">
            <p><small>For testing admin access:</small></p>
            <ul className="test-accounts">
              <li><small>Email: <strong>admin@example.com</strong>, Password: <strong>admin123</strong> (uses isAdmin flag)</small></li>
              <li><small>Email: <strong>test-admin@example.com</strong>, Password: <strong>password123</strong> (uses role property)</small></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 