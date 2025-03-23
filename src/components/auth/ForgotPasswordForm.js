import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import Button from '../common/Button';
import './ForgotPasswordForm.css';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email address is required';
    } else if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    setEmailError(null);
    
    // Validate email
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response && err.response.data) {
        // Handle specific API errors
        if (err.response.status === 404) {
          setEmailError('No account found with this email address');
        } else {
          setError(err.response.data.message || err.response.data.error || 'An error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-wrapper">
        <h2 className="forgot-password-title">Reset Your Password</h2>
        
        {submitted ? (
          <div className="success-message">
            <p>Password reset link has been sent!</p>
            <p>
              We've sent an email to <strong>{email}</strong> with instructions to reset your password. 
              Please check your inbox.
            </p>
            <div className="forgot-password-footer">
              <p>
                <Link to="/login" className="back-to-login">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="forgot-password-description">
              Enter the email address associated with your account, and we'll email you a link to reset your password.
            </p>
            
            {error && (
              <div className="forgot-password-error">
                {error}
              </div>
            )}
            
            <form className="forgot-password-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={emailError ? 'error' : ''}
                  required
                />
                {emailError && (
                  <span className="error-message">{emailError}</span>
                )}
              </div>
              
              <Button 
                type="submit" 
                fullWidth 
                loading={loading}
                disabled={loading}
              >
                Reset Password
              </Button>
            </form>
            
            <div className="forgot-password-footer">
              <p>
                Remembered your password?{' '}
                <Link to="/login" className="back-to-login">
                  Back to Login
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 