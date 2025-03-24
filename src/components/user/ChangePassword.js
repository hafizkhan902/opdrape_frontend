import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { AUTH_TOKEN_NAME } from '../../config/env';
import Button from '../common/Button';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Check authentication status
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/account/change-password' } });
    }
    
    // Verify token exists
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    if (!token) {
      console.error('No authentication token found');
      navigate('/login', { state: { from: '/account/change-password' } });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Verify token exists before submitting
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    if (!token) {
      setErrors({ 
        form: 'Your session has expired. Please log in again.' 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { from: '/account/change-password' } });
      }, 3000);
      
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      // Clear form data
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Show success message
      setSuccessMessage('Your password has been changed successfully!');
      
      // After 3 seconds, redirect to account page
      setTimeout(() => {
        navigate('/account');
      }, 3000);
      
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.response && error.response.data) {
        // Handle API error responses
        if (error.response.status === 401) {
          setErrors({ currentPassword: 'Current password is incorrect' });
        } else if (error.response.data.errors) {
          // Map API validation errors to form fields
          const apiErrors = error.response.data.errors;
          const formErrors = {};
          
          Object.keys(apiErrors).forEach(key => {
            const fieldName = key === 'password' ? 'newPassword' : key;
            formErrors[fieldName] = apiErrors[key];
          });
          
          setErrors(formErrors);
        } else {
          // Generic error from API
          setErrors({ 
            form: error.response.data.message || 'Failed to change password. Please try again.' 
          });
        }
      } else {
        // Network or other error
        setErrors({ 
          form: 'An unexpected error occurred. Please try again later.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-wrapper">
        <h2 className="change-password-title">Change Your Password</h2>
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {errors.form && (
          <div className="error-message form-error">
            {errors.form}
          </div>
        )}
        
        <form className="change-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={errors.currentPassword ? 'error' : ''}
            />
            {errors.currentPassword && (
              <span className="error-message">{errors.currentPassword}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={errors.newPassword ? 'error' : ''}
            />
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
            <small className="password-hint">
              Password must be at least 8 characters long
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>
          
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/account')}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 