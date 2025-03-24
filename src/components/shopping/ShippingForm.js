import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './ShippingForm.css';

/**
 * ShippingForm component for collecting shipping information during checkout
 * @param {Object} props Component props
 * @param {Object} props.initialValues - Initial shipping information values
 * @param {function} props.onSubmit - Function called when form is submitted (continue to payment)
 * @param {function} props.onBack - Function called when user goes back to cart
 * @param {function} props.calculateTotal - Function to calculate order total
 * @param {function} props.formatPrice - Function to format price with currency
 */
const ShippingForm = ({
  initialValues = {},
  onSubmit,
  onBack,
  calculateTotal,
  formatPrice,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh',
    ...initialValues,
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData(prevData => ({
        ...prevData,
        ...initialValues
      }));
    }
  }, [initialValues]);

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
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^\d{10,15}$/.test(value.replace(/\D/g, ''))) {
          error = 'Phone number must have 10-15 digits';
        }
        break;
      case 'address':
        if (!value.trim()) {
          error = 'Address is required';
        }
        break;
      case 'city':
        if (!value.trim()) {
          error = 'City is required';
        }
        break;
      case 'state':
        if (!value.trim()) {
          error = 'Region/Division is required';
        }
        break;
      case 'zipCode':
        if (!value.trim()) {
          error = 'Postal code is required';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validate all fields
  const validateForm = () => {
    const fieldsToValidate = [
      'fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'
    ];
    
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Call the onSubmit prop with the event and form data
    onSubmit(e, formData);
  };

  // Field styles
  const getFieldClasses = (fieldName) => {
    return `form-group ${touched[fieldName] && errors[fieldName] ? 'has-error' : ''}`;
  };

  return (
    <div className="checkout-step">
      <h2>
        <FontAwesomeIcon icon={faTruck} />
        Shipping Information
      </h2>
      <form className="shipping-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className={getFieldClasses('fullName')}>
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.fullName && errors.fullName && (
              <div className="error-message">{errors.fullName}</div>
            )}
          </div>
          <div className={getFieldClasses('email')}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.email && errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className={getFieldClasses('phone')}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.phone && errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>
        </div>
        <div className={getFieldClasses('address')}>
          <label htmlFor="address">Street Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.address && errors.address && (
            <div className="error-message">{errors.address}</div>
          )}
        </div>
        <div className="form-row">
          <div className={getFieldClasses('city')}>
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.city && errors.city && (
              <div className="error-message">{errors.city}</div>
            )}
          </div>
          <div className={getFieldClasses('state')}>
            <label htmlFor="state">Region/Division</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.state && errors.state && (
              <div className="error-message">{errors.state}</div>
            )}
          </div>
        </div>
        <div className={getFieldClasses('zipCode')}>
          <label htmlFor="zipCode">Postal Code</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.zipCode && errors.zipCode && (
            <div className="error-message">{errors.zipCode}</div>
          )}
        </div>
        <div className="form-group country-display">
          <label>Country</label>
          <div className="country-value">Bangladesh</div>
          <input type="hidden" name="country" value="Bangladesh" />
        </div>

        {/* Order summary for this step */}
        {calculateTotal && formatPrice && (
          <div className="checkout-step-summary">
            <h3>Order Total</h3>
            <div className="checkout-step-total">
              <span>Total Amount:</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Cart
          </button>
          <button
            type="submit"
            className="primary-button"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

ShippingForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  calculateTotal: PropTypes.func,
  formatPrice: PropTypes.func
};

export default ShippingForm; 