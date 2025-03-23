import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { getUser, getUserOrdersById } from '../../../services/api';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaCreditCard, FaEdit, FaArrowLeft, FaBug } from 'react-icons/fa';
import './CustomerDetail.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check URL for debug mode
  const searchParams = new URLSearchParams(location.search);
  const debugMode = searchParams.get('debug') === 'true';
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({ 
    customerId: id, 
    apiResponse: null,
    processingSteps: []
  });

  // Separate useEffect hooks for user and orders
  useEffect(() => {
    console.log("CustomerDetail - Customer ID from URL:", id);
    if (id) {
      fetchCustomerData();
    } else {
      setError("No customer ID provided");
      setLoadingCustomer(false);
    }
  }, [id]);
  
  // Only fetch orders after customer data is loaded
  useEffect(() => {
    if (customer && id) {
      fetchCustomerOrders();
    }
  }, [customer, id]);

  const fetchCustomerData = async () => {
    setLoadingCustomer(true);
    setError(null);
    
    try {
      // Log additional debug info
      setDebug(prev => ({
        ...prev,
        processingSteps: [...prev.processingSteps, `Fetching user with ID: ${id}`]
      }));
      
      const response = await getUser(id);
      
      // Store the raw API response for debugging
      setDebug(prev => ({
        ...prev,
        apiResponse: response
      }));
      
      console.log("CustomerDetail - API Response:", response);
      
      // Extract customer data based on API response format
      let customerData;
      if (response.data) {
        customerData = response.data;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Found customer data in response.data`]
        }));
      } else if (response.user) {
        customerData = response.user;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Found customer data in response.user`]
        }));
      } else {
        customerData = response;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Using response directly as customer data`]
        }));
      }
      
      console.log("CustomerDetail - Processed Customer Data:", customerData);
      
      // Create normalized customer data with consistent property names
      const normalizedCustomer = {
        id: customerData._id || customerData.id || id,
        firstName: customerData.firstName || customerData.first_name || '',
        lastName: customerData.lastName || customerData.last_name || '',
        name: customerData.name || `${customerData.firstName || customerData.first_name || ''} ${customerData.lastName || customerData.last_name || ''}`.trim(),
        email: customerData.email || '',
        phone: customerData.phone || '',
        role: customerData.role || '',
        createdAt: customerData.createdAt || customerData.created_at || new Date().toISOString(),
        address: customerData.address || customerData.shippingAddress || {},
        billingAddress: customerData.billingAddress || {},
        orderCount: customerData.orderCount || 0,
        isActive: customerData.isActive !== undefined ? customerData.isActive : true,
        // Store original data for reference
        originalData: customerData
      };
      
      console.log("CustomerDetail - Normalized Customer Data:", normalizedCustomer);
      
      setCustomer(normalizedCustomer);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(`Failed to load customer data: ${err.message}`);
      setDebug(prev => ({
        ...prev,
        processingSteps: [...prev.processingSteps, `Error: ${err.message}`]
      }));
    } finally {
      setLoadingCustomer(false);
    }
  };

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true);
    
    try {
      console.log(`CustomerDetail - Fetching orders for customer ID: ${id}`);
      setDebug(prev => ({
        ...prev,
        processingSteps: [...prev.processingSteps, `Fetching orders for user ID: ${id}`]
      }));
      
      const response = await getUserOrdersById(id);
      
      console.log("CustomerDetail - Orders API Response:", response);
      setDebug(prev => ({
        ...prev,
        ordersResponse: response
      }));
      
      // Handle different response formats
      let orderData = [];
      if (response.data && Array.isArray(response.data)) {
        orderData = response.data;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Found ${orderData.length} orders in response.data array`]
        }));
      } else if (response.data && response.data.orders && Array.isArray(response.data.orders)) {
        orderData = response.data.orders;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Found ${orderData.length} orders in response.data.orders array`]
        }));
      } else if (Array.isArray(response)) {
        orderData = response;
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `Found ${orderData.length} orders in direct response array`]
        }));
      } else {
        setDebug(prev => ({
          ...prev,
          processingSteps: [...prev.processingSteps, `No valid orders data found in response`]
        }));
      }
      
      // Sort orders by date (most recent first)
      orderData.sort((a, b) => {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      });
      
      console.log(`CustomerDetail - Processed ${orderData.length} orders`);
      setOrders(orderData);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      // Show the error in the orders section
      setDebug(prev => ({
        ...prev,
        processingSteps: [...prev.processingSteps, `Order fetch error: ${err.message}`]
      }));
      // Set orders to empty array so UI shows "no orders" message
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    
    // Handle string amounts that might include currency symbols
    if (typeof amount === 'string') {
      // If already formatted with currency, return as is
      if (amount.includes('$') || amount.includes('£') || amount.includes('€')) {
        return amount;
      }
      // Try to parse the string to a number
      amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    }
    
    // Format as USD
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatAddress = (address) => {
    if (!address) return 'No address available';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address incomplete';
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-processing';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('delivered')) {
      return 'status-completed';
    }
    if (statusLower.includes('cancel')) {
      return 'status-cancelled';
    }
    if (statusLower.includes('pending') || statusLower.includes('payment')) {
      return 'status-pending';
    }
    return 'status-processing';
  };

  // Getter functions to ensure we have clean data
  const getCustomerName = () => {
    if (!customer) return 'Unknown Customer';
    
    if (customer.name && customer.name !== ' ') {
      return customer.name;
    }
    
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'Unnamed Customer';
  };

  const getInitials = () => {
    if (!customer) return '';
    
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Return the customer detail component
  if (loadingCustomer) {
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

  if (!customer) {
    return (
      <div className="error-container">
        <div className="error-message">Customer not found</div>
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
    <div className="customer-detail-container">
      {/* Debug section - only shown when ?debug=true is in the URL */}
      {debugMode && (
        <div className="debug-section">
          <div className="debug-header">
            <FaBug /> Debug Information
            <small>(Remove this section in production)</small>
          </div>
          <div className="debug-content">
            <div className="debug-item">
              <strong>Customer ID from URL:</strong> {id}
            </div>
            <div className="debug-item">
              <strong>Customer ID in state:</strong> {customer.id}
            </div>
            <div className="debug-item">
              <strong>Data Source:</strong> {debug.apiResponse?.statusText || 'Unknown'}
            </div>
            <div className="debug-item">
              <strong>Processing Steps:</strong>
              <ol className="debug-steps">
                {debug.processingSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <details className="debug-raw-data">
              <summary>View Raw Customer Data</summary>
              <pre>{JSON.stringify(customer.originalData, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}

      <div className="customer-detail-header">
        <Link to="/admin/customers" className="back-link">
          <FaArrowLeft /> Back to Customers
        </Link>
        <Link to={`/admin/customers/${id}/edit`} className="edit-customer-btn">
          <FaEdit /> Edit Customer
        </Link>
      </div>
      
      <div className="customer-profile-section">
        <div className="customer-avatar">
          {getInitials()}
        </div>
        <div className="customer-basic-info">
          <h1>{getCustomerName()}</h1>
          <p className="customer-since">Customer since {formatDate(customer.createdAt || new Date().toISOString())}</p>
        </div>
      </div>
      
      <div className="customer-details-grid">
        <div className="customer-detail-card">
          <h3>Contact Information</h3>
          <div className="detail-item">
            <div className="detail-icon">
              <FaEnvelope />
            </div>
            <div className="detail-content">
              <label>Email</label>
              <p>{customer.email || 'No email available'}</p>
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-icon">
              <FaPhone />
            </div>
            <div className="detail-content">
              <label>Phone</label>
              <p>{customer.phone || 'No phone number available'}</p>
            </div>
          </div>
        </div>
        
        <div className="customer-detail-card">
          <h3>Shipping Address</h3>
          <div className="detail-item">
            <div className="detail-icon">
              <FaMapMarkerAlt />
            </div>
            <div className="detail-content">
              <label>Address</label>
              <p>{formatAddress(customer.address)}</p>
            </div>
          </div>
        </div>
        
        <div className="customer-detail-card">
          <h3>Billing Address</h3>
          <div className="detail-item">
            <div className="detail-icon">
              <FaCreditCard />
            </div>
            <div className="detail-content">
              <label>Address</label>
              <p>{formatAddress(customer.billingAddress)}</p>
            </div>
          </div>
        </div>
        
        <div className="customer-detail-card">
          <h3>Account Details</h3>
          <div className="detail-item">
            <div className="detail-icon">
              <FaUser />
            </div>
            <div className="detail-content">
              <label>Customer ID</label>
              <p>{customer.id || 'Unknown'}</p>
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-icon">
              <FaCalendarAlt />
            </div>
            <div className="detail-content">
              <label>Account Creation</label>
              <p>{formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="customer-orders-section">
        <h2>Order History</h2>
        
        {loadingOrders ? (
          <div className="loading-message">Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders-message">No orders found for this customer.</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              // Generate a unique ID for the order if not present
              const orderId = order._id || order.id || `order-${Math.random().toString(36).substring(2, 9)}`;
              // Calculate order total
              const orderTotal = order.totalAmount || order.total || 
                (order.items && order.items.reduce((sum, item) => {
                  const price = item.price || (item.product && item.product.price) || 0;
                  const quantity = item.quantity || 1;
                  return sum + (price * quantity);
                }, 0));
              
              return (
                <div key={orderId} className="order-card">
                  <div className="order-header">
                    <div className="order-basic-info">
                      <div className="order-id">
                        <span className="label">Order ID:</span> {orderId}
                      </div>
                      <div className="order-date">
                        <span className="label">Date:</span> {formatDate(order.createdAt || order.date)}
                      </div>
                    </div>
                    <div className="order-status-price">
                      <div className={`order-status status-${order.status?.toLowerCase() || 'processing'}`}>
                        {order.status || 'Processing'}
                      </div>
                      <div className="order-total">
                        <span className="label">Total:</span> ${(orderTotal / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-items-section">
                      <h4>Items</h4>
                      {order.items && order.items.length > 0 ? (
                        <table className="order-items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, index) => {
                              const productName = item.name || 
                                (item.product && (item.product.name || item.product.title)) || 
                                `Product #${index + 1}`;
                              const productPrice = item.price || 
                                (item.product && item.product.price) || 0;
                              const quantity = item.quantity || 1;
                              const subtotal = productPrice * quantity;
                              
                              return (
                                <tr key={index}>
                                  <td>{productName}</td>
                                  <td>{quantity}</td>
                                  <td>${(productPrice / 100).toFixed(2)}</td>
                                  <td>${(subtotal / 100).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p>No items found in this order.</p>
                      )}
                    </div>
                    
                    <div className="order-details-columns">
                      <div className="order-shipping-info">
                        <h4>Shipping Address</h4>
                        <p>{formatAddress(order.shippingAddress)}</p>
                      </div>
                      
                      <div className="order-payment-info">
                        <h4>Payment Information</h4>
                        <p><strong>Method:</strong> {order.paymentMethod || 'Not specified'}</p>
                        {order.paymentDetails && (
                          <div className="payment-details">
                            {order.paymentDetails.transactionId && (
                              <p><strong>Transaction ID:</strong> {order.paymentDetails.transactionId}</p>
                            )}
                            {order.paymentDetails.paymentNumber && (
                              <p><strong>Payment Number:</strong> {order.paymentDetails.paymentNumber}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      <Link to={`/admin/orders/${orderId}`} className="view-order-btn">
                        View Order Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail; 