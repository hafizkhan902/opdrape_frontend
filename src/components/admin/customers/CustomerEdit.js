import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTimes, FaUser } from 'react-icons/fa';
import { getUser, updateUser } from '../../../services/api';
import './CustomerEdit.css';

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'customer',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [useSameAddress, setUseSameAddress] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  useEffect(() => {
    if (useSameAddress && formData.address) {
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...prev.address }
      }));
    }
  }, [useSameAddress, formData.address]);

  const fetchCustomerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUser(id);
      
      console.log('Raw user data response:', response);
      
      // Extract customer data based on API response format
      let customerData;
      if (response.data) {
        customerData = response.data;
      } else if (response.user) {
        customerData = response.user;
      } else {
        customerData = response;
      }
      
      console.log('Processed customer data:', customerData);
      setCustomer(customerData);
      
      // Handle name fields - backend might use name as a single field or firstName/lastName
      let firstName = '';
      let lastName = '';
      
      if (customerData.firstName || customerData.first_name) {
        firstName = customerData.firstName || customerData.first_name || '';
      } else if (customerData.name && customerData.name.includes(' ')) {
        // If there's only a full name field, split it
        const nameParts = customerData.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      if (customerData.lastName || customerData.last_name) {
        lastName = customerData.lastName || customerData.last_name || '';
      }
      
      // Initialize form data with customer data
      const initialFormData = {
        firstName: firstName,
        lastName: lastName,
        name: customerData.name || `${firstName} ${lastName}`.trim(),
        email: customerData.email || '',
        phone: customerData.phone || '',
        role: customerData.role || 'customer',
        address: {
          street: customerData.address?.street || customerData.shippingAddress?.street || '',
          city: customerData.address?.city || customerData.shippingAddress?.city || '',
          state: customerData.address?.state || customerData.shippingAddress?.state || '',
          zipCode: customerData.address?.zipCode || customerData.shippingAddress?.zipCode || '',
          country: customerData.address?.country || customerData.shippingAddress?.country || ''
        },
        billingAddress: {
          street: customerData.billingAddress?.street || '',
          city: customerData.billingAddress?.city || '',
          state: customerData.billingAddress?.state || '',
          zipCode: customerData.billingAddress?.zipCode || '',
          country: customerData.billingAddress?.country || ''
        }
      };
      
      // Check if billing and shipping are the same
      const addressesAreSame = 
        initialFormData.address.street === initialFormData.billingAddress.street &&
        initialFormData.address.city === initialFormData.billingAddress.city &&
        initialFormData.address.state === initialFormData.billingAddress.state &&
        initialFormData.address.zipCode === initialFormData.billingAddress.zipCode &&
        initialFormData.address.country === initialFormData.billingAddress.country;
      
      setUseSameAddress(addressesAreSame);
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(`Failed to load customer data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Add other field validations as needed
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare data for API
      const userData = {
        // Include both name and firstName/lastName fields to ensure it works with different backends
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        // If same address is checked, use shipping address for billing
        address: formData.address,
        billingAddress: useSameAddress ? formData.address : formData.billingAddress
      };
      
      console.log('Submitting user data:', userData);
      
      // Update user through API
      await updateUser(id, userData);
      
      // Navigate back to customer detail page
      navigate(`/admin/customers/${id}`);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(`Failed to update customer information: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading customer information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="back-button" 
          onClick={() => navigate('/admin/customers')}
        >
          <FaArrowLeft /> Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="customer-edit-container">
      <div className="customer-edit-header">
        <Link to={`/admin/customers/${id}`} className="back-link">
          <FaArrowLeft /> Back to Customer Detail
        </Link>
        <h1>Edit Customer</h1>
      </div>
      
      <div className="customer-profile-section">
        <div className="customer-avatar">
          <FaUser />
        </div>
        <div className="customer-basic-info">
          <h2>{formData.firstName} {formData.lastName}</h2>
          <p className="customer-id">ID: {id}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="customer-edit-form">
        {error && <div className="form-error-message">{error}</div>}
        
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={formErrors.firstName ? 'input-error' : ''}
              />
              {formErrors.firstName && <div className="field-error">{formErrors.firstName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={formErrors.lastName ? 'input-error' : ''}
              />
              {formErrors.lastName && <div className="field-error">{formErrors.lastName}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'input-error' : ''}
              />
              {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Shipping Address</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="address.street">Street Address</label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">City</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.state">State/Province</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.zipCode">Postal Code</label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address.country">Country</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Billing Address</h3>
          <div className="form-row checkbox-row">
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="useSameAddress"
                checked={useSameAddress}
                onChange={() => setUseSameAddress(!useSameAddress)}
              />
              <label htmlFor="useSameAddress">Same as shipping address</label>
            </div>
          </div>
          
          {!useSameAddress && (
            <>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="billingAddress.street">Street Address</label>
                  <input
                    type="text"
                    id="billingAddress.street"
                    name="billingAddress.street"
                    value={formData.billingAddress.street}
                    onChange={handleInputChange}
                    disabled={useSameAddress}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billingAddress.city">City</label>
                  <input
                    type="text"
                    id="billingAddress.city"
                    name="billingAddress.city"
                    value={formData.billingAddress.city}
                    onChange={handleInputChange}
                    disabled={useSameAddress}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="billingAddress.state">State/Province</label>
                  <input
                    type="text"
                    id="billingAddress.state"
                    name="billingAddress.state"
                    value={formData.billingAddress.state}
                    onChange={handleInputChange}
                    disabled={useSameAddress}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billingAddress.zipCode">Postal Code</label>
                  <input
                    type="text"
                    id="billingAddress.zipCode"
                    name="billingAddress.zipCode"
                    value={formData.billingAddress.zipCode}
                    onChange={handleInputChange}
                    disabled={useSameAddress}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="billingAddress.country">Country</label>
                  <input
                    type="text"
                    id="billingAddress.country"
                    name="billingAddress.country"
                    value={formData.billingAddress.country}
                    onChange={handleInputChange}
                    disabled={useSameAddress}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate(`/admin/customers/${id}`)}
          >
            <FaTimes /> Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEdit; 