import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faLocationDot, 
  faBox,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { getUserProfile, updateUserProfile } from '../../services/api';
import Button from '../common/Button';
import OrderHistory from '../shopping/OrderHistory';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Debug log the received profile data
  const logProfileData = (data) => {
    console.log('Complete profile data received from API:', data);
    return data;
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileResponse = await getUserProfile();
        const profileData = logProfileData(profileResponse.data);
        setProfile(profileData);
        
        // Initialize form data with profile data
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: {
            street: profileData.address?.street || '',
            city: profileData.address?.city || '',
            state: profileData.address?.state || '',
            zipCode: profileData.address?.zipCode || '',
            country: profileData.address?.country || ''
          }
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (address)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
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

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Debug log the form data before submission
  const logFormSubmission = (data) => {
    console.log('Form data being submitted:', data);
    return data;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Log the form data being submitted
      const dataToSubmit = logFormSubmission(formData);
      
      const response = await updateUserProfile(dataToSubmit);
      console.log('Profile update response:', response.data);
      
      setProfile(response.data);
      setIsEditing(false);
      setUpdateSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Improved error message handling
      let errorMessage = 'Failed to update profile: ';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const statusCode = err.response.status;
        const responseData = err.response.data;
        
        if (statusCode === 404) {
          errorMessage += 'API endpoint not found. The backend URL may need to be updated.';
        } else if (statusCode === 400) {
          errorMessage += responseData.message || 'Invalid data submitted.';
        } else if (statusCode === 401) {
          errorMessage += 'Authentication required. Please log in again.';
        } else if (statusCode === 403) {
          errorMessage += 'You do not have permission to update this profile.';
        } else if (statusCode >= 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += responseData.message || 'Unknown error occurred.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Render loading state
  if (loading && !profile) {
    return <div className="loading">Loading user data...</div>;
  }

  // Render error state
  if (error && !profile) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-profile-container">
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FontAwesomeIcon icon={faUser} />
          My Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FontAwesomeIcon icon={faBox} />
          Order History
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' && (
          <>
            {isEditing ? (
              // Edit Profile Form
              <form onSubmit={handleSubmit} className="profile-edit-form">
                {error && <div className="error-message">{error}</div>}
                {updateSuccess && (
                  <div className="success-message">Profile updated successfully!</div>
                )}
                
                <div className="profile-header">
                  <h2>Edit Your Profile</h2>
                </div>
                
                {/* Developer Note */}
                <div className="developer-note">
                  <h4>Developer Note:</h4>
                  <p>If you encounter a "Route not found" error when updating your profile, this may indicate that the backend 
                  API endpoint for profile updates is not configured correctly. The frontend is trying multiple HTTP methods 
                  (PATCH, POST, PUT) and various endpoint paths to find the right one. Please check your browser console 
                  for detailed logs and ensure your backend has a proper route for profile updates.</p>
                </div>
                
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                    {formErrors.name && (
                      <small className="error">{formErrors.name}</small>
                    )}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                        title="Email cannot be changed"
                      />
                      <small>Email address cannot be changed.</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                      {formErrors.phone && (
                        <small className="error">{formErrors.phone}</small>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3>Address Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="street">Street Address</label>
                    <input
                      type="text"
                      id="street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="state">State/Province</label>
                      <input
                        type="text"
                        id="state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="Enter state or province"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP/Postal Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                        placeholder="Enter ZIP or postal code"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary"
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              // Display Profile Info
              <>
                <div className="profile-header">
                  <h2>Your Profile</h2>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
                
                <div className="profile-details">
                  <div className="profile-field">
                    <div className="field-icon">
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className="field-content">
                      <span className="field-label">Name</span>
                      <span className="field-value">{profile?.name}</span>
                    </div>
                  </div>
                  
                  <div className="profile-field">
                    <div className="field-icon">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </div>
                    <div className="field-content">
                      <span className="field-label">Email</span>
                      <span className="field-value">{profile?.email}</span>
                    </div>
                  </div>
                  
                  {profile?.phone && (
                    <div className="profile-field">
                      <div className="field-icon">
                        <FontAwesomeIcon icon={faPhone} />
                      </div>
                      <div className="field-content">
                        <span className="field-label">Phone</span>
                        <span className="field-value">{profile.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {profile?.createdAt && (
                    <div className="profile-field">
                      <div className="field-icon">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                      <div className="field-content">
                        <span className="field-label">Member Since</span>
                        <span className="field-value">{formatDate(profile.createdAt)}</span>
                      </div>
                    </div>
                  )}
                  
                  {profile?.address && (
                    <div className="profile-field">
                      <div className="field-icon">
                        <FontAwesomeIcon icon={faLocationDot} />
                      </div>
                      <div className="field-content">
                        <span className="field-label">Shipping Address</span>
                        {profile.address.street || profile.address.city || profile.address.state ? (
                          <div className="profile-address">
                            {profile.address.street && <p>{profile.address.street}</p>}
                            <p>
                              {profile.address.city}{profile.address.city && profile.address.state ? ', ' : ''}
                              {profile.address.state} {profile.address.zipCode}
                            </p>
                            {profile.address.country && <p>{profile.address.country}</p>}
                          </div>
                        ) : (
                          <span className="no-address">No address saved</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
        
        {activeTab === 'orders' && (
          <OrderHistory />
        )}
      </div>
    </div>
  );
};

export default UserProfile; 