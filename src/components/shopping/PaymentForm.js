import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PaymentForm.css';

/**
 * PaymentForm component for processing payments
 * @param {Object} props Component props
 * @param {number} props.amount - The amount to charge
 * @param {function} props.onPaymentComplete - Function called when payment is successful
 * @param {function} props.onCancel - Function called when payment is canceled
 * @param {boolean} props.loading - Whether payment is being processed
 */
const PaymentForm = ({
  amount = 0,
  onPaymentComplete,
  onCancel,
  loading = false,
}) => {
  // Available payment methods
  const paymentMethods = [
    { id: 'bkash', name: 'Bkash', icon: 'bkash' },
    { id: 'nagad', name: 'Nagad', icon: 'nagad' },
    { id: 'cod', name: 'Cash On Delivery', icon: 'cod' }
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    paymentMethod: '',
    mobileNumber: '',
    transactionId: '',
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Reset fields that are only relevant to specific payment methods
    if (name === 'paymentMethod') {
      if (value === 'cod') {
        setFormData(prev => ({ ...prev, mobileNumber: '', transactionId: '' }));
      } else if (value === 'bkash' || value === 'nagad') {
        setFormData(prev => ({ ...prev, transactionId: '' })); // Reset transactionId when switching methods
      }
    }
  };

  // Handle blur event for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  // Validate a single field
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'paymentMethod':
        if (!value) {
          error = 'Please select a payment method';
        }
        break;
        
      case 'mobileNumber':
        if (formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') {
          if (!value) {
            error = 'Mobile number is required';
          } else if (!/^\d{11}$/.test(value)) {
            error = 'Enter a valid 11-digit mobile number';
          }
        }
        break;

      case 'transactionId':
        // Only validate transactionId when it's required to be entered
        if ((formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && 
            formData.mobileNumber && // Only require transaction ID if mobile is entered
            !value) {
          error = 'Transaction ID is required';
        } else if (value && value.length < 6) {
          error = 'Transaction ID must be at least 6 characters long';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validate all required fields
  const validateForm = () => {
    const fieldsToValidate = ['paymentMethod'];
    
    // Add conditional fields based on payment method
    if (formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') {
      fieldsToValidate.push('mobileNumber');
      
      // Only require transaction ID for mobile payments if we're ready to validate it
      // This would be different in a real app where you might have multiple steps
      if (formData.mobileNumber && !errors.mobileNumber) {
        fieldsToValidate.push('transactionId');
      }
    }
    
    const newErrors = {};
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
        newErrors[field] = errors[field] || `${field} is invalid`;
      }
    });
    
    setErrors(newErrors);
    
    // Mark all fields as touched
    const newTouched = {};
    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Format payment data according to backend requirements
    const paymentData = {
      amount,
      paymentMethod: formData.paymentMethod,
    };
    
    // Add payment details for mobile payments
    if (formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') {
      paymentData.paymentDetails = {
        paymentNumber: formData.mobileNumber,
        transactionId: formData.transactionId
      };
      
      // Validate payment number format
      if (!/^\d{11}$/.test(formData.mobileNumber)) {
        setErrors({
          mobileNumber: 'Payment number must be 11 digits',
          general: 'Please fix the errors in the form'
        });
        return;
      }
      
      // Validate transaction ID
      if (formData.transactionId.length < 6) {
        setErrors({
          transactionId: 'Transaction ID must be at least 6 characters',
          general: 'Please fix the errors in the form'
        });
        return;
      }
    }
    
    // Example of how payment would be processed in a real app
    try {
      console.log('Processing payment with formatted data:', paymentData);
      console.log('API Endpoint: POST /payment/process');
      
      // For demo purposes, simulate API response
      onPaymentComplete({
        ...paymentData,
        status: 'success',
        transactionId: formData.transactionId || 'cod_' + Math.random().toString(36).substr(2, 9),
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      // In a real app, you would handle this error properly
      setErrors({ general: 'Payment processing failed. Please try again.' });
    }
  };

  // Get styles for input fields based on validation
  const getFieldClasses = (fieldName) => {
    return `payment-form__input ${touched[fieldName] && errors[fieldName] ? 'payment-form__input--error' : ''}`;
  };

  // Get instructions for the selected payment method
  const getPaymentInstructions = (methodId) => {
    switch (methodId) {
      case 'bkash':
        return {
          title: 'Pay with Bkash',
          merchantNumber: '01701234567', // Merchant bKash number
          steps: [
            'Open your Bkash app',
            `Send ${amount.toFixed(2)} BDT to 01701234567`,
            'Copy the Transaction ID from your bKash app',
            'Enter your bKash number and Transaction ID below for verification'
          ]
        };
      case 'nagad':
        return {
          title: 'Pay with Nagad',
          merchantNumber: '01801234567', // Merchant Nagad number
          steps: [
            'Open your Nagad app',
            `Send ${amount.toFixed(2)} BDT to 01801234567`,
            'Copy the Transaction ID from your Nagad app',
            'Enter your Nagad number and Transaction ID below for verification'
          ]
        };
      case 'cod':
        return {
          title: 'Cash On Delivery',
          steps: [
            'We will collect payment when your order is delivered',
            'No advance payment is required',
            'Additional delivery charge may apply'
          ]
        };
      default:
        return { title: '', merchantNumber: '', steps: [] };
    }
  };

  return (
    <div className="payment-form">
      <h3 className="payment-form__title">Payment Method</h3>
      
      {/* General error message */}
      {errors.general && (
        <div className="payment-form__general-error">
          {errors.general}
        </div>
      )}

      <form className="payment-form__form" onSubmit={handleSubmit}>
        {/* Payment Method Selection */}
        <div className="payment-form__methods">
          {paymentMethods.map(method => (
            <label 
              key={method.id} 
              className={`payment-form__method ${formData.paymentMethod === method.id ? 'payment-form__method--active' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={formData.paymentMethod === method.id}
                onChange={handleChange}
                className="payment-form__method-input"
                disabled={loading}
              />
              <div className="payment-form__method-content">
                <div className={`payment-form__method-icon payment-form__method-icon--${method.icon}`} />
                <span className="payment-form__method-name">{method.name}</span>
              </div>
            </label>
          ))}
        </div>
        
        {touched.paymentMethod && errors.paymentMethod && (
          <div className="payment-form__error">{errors.paymentMethod}</div>
        )}
        
        {/* Method specific fields */}
        {formData.paymentMethod && (
          <div className="payment-form__method-details">
            {/* Payment instructions */}
            <div className="payment-form__instructions">
              <h4 className="payment-form__instructions-title">
                {getPaymentInstructions(formData.paymentMethod).title}
              </h4>
              <ol className="payment-form__instructions-steps">
                {getPaymentInstructions(formData.paymentMethod).steps.map((step, index) => (
                  <li key={index} className="payment-form__instructions-step">{step}</li>
                ))}
              </ol>
            </div>
            
            {/* Mobile payments (Bkash, Nagad) fields */}
            {(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && (
              <div className="payment-form__mobile-verification">
                <div className="payment-form__merchant-number">
                  <span className="payment-form__merchant-label">Send payment to:</span>
                  <span className="payment-form__merchant-value">
                    {getPaymentInstructions(formData.paymentMethod).merchantNumber}
                  </span>
                  <div className="payment-form__verification-note">
                    Please ensure you send the exact amount: <strong>${amount.toFixed(2)} BDT</strong>
                  </div>
                </div>
                
                <div className="payment-form__field">
                  <label htmlFor="mobileNumber" className="payment-form__label">
                    Your {formData.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number <span className="payment-form__required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getFieldClasses('mobileNumber')}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                    required
                  />
                  {touched.mobileNumber && errors.mobileNumber && (
                    <div className="payment-form__error">{errors.mobileNumber}</div>
                  )}
                </div>
                
                {/* Only show transaction ID input if mobile number is valid */}
                {formData.mobileNumber && !errors.mobileNumber && (
                  <div className="payment-form__field">
                    <label htmlFor="transactionId" className="payment-form__label">
                      Transaction ID <span className="payment-form__required">*</span>
                    </label>
                    <div className="payment-form__transaction-help">
                      (Find this in the SMS or notification you received after payment)
                    </div>
                    <input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClasses('transactionId')}
                      placeholder="e.g., TrxID12345678"
                      disabled={loading}
                      required
                    />
                    {touched.transactionId && errors.transactionId && (
                      <div className="payment-form__error">{errors.transactionId}</div>
                    )}
                  </div>
                )}
                
                <div className="payment-form__verification-info">
                  <div className="payment-form__verification-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  </div>
                  <div className="payment-form__verification-text">
                    Your payment will be verified before order processing. Please ensure you enter the correct transaction details.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Amount display */}
        <div className="payment-form__amount">
          <div className="payment-form__amount-label">Total Amount:</div>
          <div className="payment-form__amount-value">${amount.toFixed(2)}</div>
        </div>
        
        {/* Form actions */}
        <div className="payment-form__actions">
          <button
            type="button"
            className="payment-form__button payment-form__button--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="payment-form__button payment-form__button--primary"
            disabled={loading || !formData.paymentMethod}
          >
            {loading ? 'Processing...' : `Complete Order`}
          </button>
        </div>
        
        {/* Security note */}
        <div className="payment-form__security">
          <div className="payment-form__secure-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 11h7c-.53 4.12-3.28 7.79-7 8.94V12zm0 9c-3.72-1.15-6.47-4.82-7-8.94h7v8.94zm0-11H5V6.3l7-3.11v8.8zm0-8.8l7 3.11V11h-7V2.2z" />
            </svg>
          </div>
          <div className="payment-form__security-text">
            Your payment information is secure and encrypted.
          </div>
        </div>
      </form>
    </div>
  );
};

PaymentForm.propTypes = {
  amount: PropTypes.number.isRequired,
  onPaymentComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default PaymentForm; 