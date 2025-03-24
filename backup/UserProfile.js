import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faLocationDot, 
  faCalendarAlt,
  faBox,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import { getUserProfile, updateUserProfile, getUserOrders } from '../../services/api';
import Button from '../common/Button';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasAttemptedOrderFetch, setHasAttemptedOrderFetch] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileResponse = await getUserProfile();
        setProfile(profileResponse.data);
        
        // Initialize form data with profile data
        setFormData({
          firstName: profileResponse.data.firstName || '',
          lastName: profileResponse.data.lastName || '',
          email: profileResponse.data.email || '',
          phone: profileResponse.data.phone || '',
          address: {
            street: profileResponse.data.address?.street || '',
            city: profileResponse.data.address?.city || '',
            state: profileResponse.data.address?.state || '',
            zipCode: profileResponse.data.address?.zipCode || '',
            country: profileResponse.data.address?.country || ''
          }
        });
        
        if (activeTab === 'orders') {
          setHasAttemptedOrderFetch(true);
          const ordersResponse = await getUserOrders();
          setOrders(ordersResponse.data);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [activeTab]);

  // Fetch orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && !loading && orders.length === 0 && !hasAttemptedOrderFetch) {
      const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        setHasAttemptedOrderFetch(true); // Set this flag to prevent the infinite loop
        
        try {
          const ordersResponse = await getUserOrders();
          console.log('Orders API response:', ordersResponse);
          
          // Extract and normalize orders from response
          let extractedOrders = [];
          
          if (ordersResponse?.data) {
            // Handle different response structures
            if (Array.isArray(ordersResponse.data)) {
              extractedOrders = ordersResponse.data;
            } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
              extractedOrders = ordersResponse.data.orders;
            } else if (ordersResponse.data.data && Array.isArray(ordersResponse.data.data)) {
              extractedOrders = ordersResponse.data.data;
            } else if (typeof ordersResponse.data === 'object') {
              // Check any properties that might contain an array of orders
              for (const key in ordersResponse.data) {
                if (Array.isArray(ordersResponse.data[key])) {
                  extractedOrders = ordersResponse.data[key];
                  console.log(`Found orders array in response property: ${key}`);
                  break;
                }
              }
            }
          }
          
          console.log('Extracted orders before normalization:', extractedOrders);
          
          // Normalize orders to ensure they have all required properties
          const normalizedOrders = extractedOrders.map(order => {
            // Create a normalized order object with fallback values
            return {
              // Essential order properties
              id: order.id || order._id || order.orderId || `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              orderNumber: order.orderNumber || order.order_number || order.number || `#${Math.floor(10000 + Math.random() * 90000)}`,
              status: order.status || 'Processing',
              createdAt: order.createdAt || order.created_at || order.orderDate || order.date || new Date().toISOString(),
              
              // Order items with product info
              items: Array.isArray(order.items) ? order.items.map(item => ({
                id: item.id || item._id || item.product_id || item.productId || `item-${Math.random().toString(36).substring(2, 7)}`,
                quantity: parseInt(item.quantity || item.qty || 1),
                price: parseFloat(item.price || item.unit_price || 0),
                product: {
                  name: item.product?.name || item.productName || item.name || item.product_name || 'Product',
                  image: item.product?.image || item.image || item.productImage || item.thumbnail || 'https://via.placeholder.com/80x80'
                },
                color: item.color || item.variant_color || '',
                size: item.size || item.variant_size || ''
              })) : [],
              
              // Order totals
              subtotal: parseFloat(order.subtotal || order.sub_total || 0),
              shippingCost: parseFloat(order.shippingCost || order.shipping_cost || order.shipping || 0),
              tax: parseFloat(order.tax || 0),
              total: parseFloat(order.total || 0)
            };
          });
          
          console.log('Normalized orders:', normalizedOrders);
          setOrders(normalizedOrders);
        } catch (err) {
          console.error('Error fetching orders:', err);
          setError('Failed to load order history. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrders();
    }
  }, [activeTab, loading, hasAttemptedOrderFetch]); // Removed orders.length from dependencies

  // Reset the order fetch flag when switching tabs
  useEffect(() => {
    if (activeTab !== 'orders') {
      setHasAttemptedOrderFetch(false);
    }
  }, [activeTab]);

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
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await updateUserProfile(formData);
      setProfile(response.data);
      setIsEditing(false);
      setUpdateSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                    {formErrors.firstName && (
                      <small className="error">{formErrors.firstName}</small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                    {formErrors.lastName && (
                      <small className="error">{formErrors.lastName}</small>
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
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
                      <span className="field-value">
                        {profile?.firstName} {profile?.lastName}
                      </span>
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
                  
                  <div className="profile-field">
                    <div className="field-icon">
                      <FontAwesomeIcon icon={faLocationDot} />
                    </div>
                    <div className="field-content">
                      <span className="field-label">Shipping Address</span>
                      {profile?.address?.street ? (
                        <div className="profile-address">
                          <p>{profile.address.street}</p>
                          <p>
                            {profile.address.city}{profile.address.city && profile.address.state ? ', ' : ''}
                            {profile.address.state} {profile.address.zipCode}
                          </p>
                          <p>{profile.address.country}</p>
                        </div>
                      ) : (
                        <span className="no-address">No address saved</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        
        {activeTab === 'orders' && (
          <div className="order-history">
            <h2>Order History</h2>
            
            {loading ? (
              <div className="loading">Loading orders...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : orders.length === 0 ? (
              <div className="empty-orders">
                <FontAwesomeIcon icon={faBox} size="3x" />
                <h3>No orders yet</h3>
                <p>When you place orders, they will appear here.</p>
                <Button variant="primary" onClick={() => window.location.href = '/'}>
                  Start Shopping
                </Button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="order-item">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.orderNumber}</h3>
                      <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    
                    <div className="order-status">
                      <span className={`status-badge status-${order.status?.toLowerCase() || 'processing'}`}>
                        {order.status || 'Processing'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-products">
                    {order.items && order.items.length > 0 ? order.items.map((item, itemIndex) => (
                      <div key={item.id || `item-${itemIndex}`} className="order-product">
                        <div className="product-image">
                          <img 
                            src={
                              (item.product && item.product.image) || 
                              item.image || 
                              'https://via.placeholder.com/80x80'
                            } 
                            alt={
                              (item.product && item.product.name) || 
                              item.name || 
                              item.productName || 
                              'Product'
                            } 
                          />
                        </div>
                        
                        <div className="product-details">
                          <h4>
                            {(item.product && item.product.name) || 
                             item.name || 
                             item.productName || 
                             'Product'}
                          </h4>
                          {(item.color || item.size) && (
                            <p className="product-variant">
                              {item.color && <span>Color: {item.color}</span>}
                              {item.color && item.size && ' | '}
                              {item.size && <span>Size: {item.size}</span>}
                            </p>
                          )}
                          <p className="product-price">
                            {item.quantity || 1} x {
                              typeof item.price === 'number' 
                                ? `৳${item.price.toFixed(2)}` 
                                : `৳${parseFloat(item.price || 0).toFixed(2)}`
                            }
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="no-items-message">
                        <p>No items available for this order</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-summary">
                    <div className="order-totals">
                      <div className="total-item">
                        <span>Subtotal:</span>
                        <span>৳{typeof order.subtotal === 'number' ? order.subtotal.toFixed(2) : parseFloat(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="total-item">
                        <span>Shipping:</span>
                        <span>৳{typeof order.shippingCost === 'number' ? order.shippingCost.toFixed(2) : parseFloat(order.shippingCost || 0).toFixed(2)}</span>
                      </div>
                      {(order.tax > 0 || typeof order.tax === 'undefined') && (
                        <div className="total-item">
                          <span>Tax:</span>
                          <span>৳{typeof order.tax === 'number' ? order.tax.toFixed(2) : parseFloat(order.tax || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="total-item total">
                        <span>Total:</span>
                        <span>৳{typeof order.total === 'number' ? order.total.toFixed(2) : parseFloat(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = `/orders/${order.id}`}
                      >
                        <FontAwesomeIcon icon={faBox} />
                        View Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 