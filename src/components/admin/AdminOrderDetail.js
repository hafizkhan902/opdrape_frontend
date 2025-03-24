import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAdminOrderById, updateOrderStatus } from '../../services/api';
import './AdminOrderDetail.css';
import { 
  FaArrowLeft, FaTruck, FaSpinner, FaExclamationTriangle, 
  FaCheck, FaBoxOpen, FaTimesCircle, FaClock, FaCreditCard,
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaPrint,
  FaFileInvoice, FaShippingFast, FaRegCreditCard
} from 'react-icons/fa';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Define order status options
  const orderStatuses = [
    { value: 'pending', label: 'Pending', icon: <FaClock className="status-icon" /> },
    { value: 'processing', label: 'Processing', icon: <FaSpinner className="status-icon" /> },
    { value: 'payment_confirmed', label: 'Payment Confirmed', icon: <FaCreditCard className="status-icon" /> },
    { value: 'shipped', label: 'Shipped', icon: <FaTruck className="status-icon" /> },
    { value: 'delivered', label: 'Delivered', icon: <FaBoxOpen className="status-icon" /> },
    { value: 'canceled', label: 'Canceled', icon: <FaTimesCircle className="status-icon" /> },
    { value: 'completed', label: 'Completed', icon: <FaCheck className="status-icon" /> }
  ];

  // Load order details when the component mounts
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAdminOrderById(orderId);
        const orderData = response.data;
        setOrder(orderData);
        setNewStatus(orderData.status || 'pending');
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '৳0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge class based on order status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'payment_confirmed':
        return 'status-payment-confirmed';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'canceled':
        return 'status-canceled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  // Get status label and icon based on status value
  const getStatusInfo = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status) || orderStatuses[0];
    return {
      label: statusObj.label,
      icon: statusObj.icon
    };
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setStatusLoading(true);
    setStatusError(null);
    setStatusSuccess(false);

    try {
      await updateOrderStatus(orderId, newStatus);
      setOrder({ ...order, status: newStatus });
      setStatusSuccess(true);
      
      // Reset success message after some time
      setTimeout(() => {
        setStatusSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating order status:', err);
      setStatusError('Failed to update the order status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Define a helper function to get product image with debug logging
  const getProductImage = (item) => {
    // First check if the product has colorVariants with images
    if (item.product && typeof item.product === 'object') {
      // Check for colorVariants array
      if (item.product.colorVariants && item.product.colorVariants.length > 0) {
        const colorVariant = item.product.colorVariants[0];
        
        // Check if colorVariant has images array
        if (colorVariant.images && colorVariant.images.length > 0) {
          const imageData = colorVariant.images[0];
          
          // Image could be a string or an object with url property
          if (typeof imageData === 'string') {
            return imageData;
          } else if (imageData && typeof imageData === 'object') {
            return imageData.url || imageData.src || imageData;
          }
        }
      }
      
      // Also check for a single colorVariant object (not in array)
      if (item.product.colorVariant) {
        if (item.product.colorVariant.images && item.product.colorVariant.images.length > 0) {
          const imageData = item.product.colorVariant.images[0];
          return typeof imageData === 'string' ? imageData : imageData.url || imageData.src || imageData;
        }
      }
      
      // Try other common image paths if colorVariant is not found
      if (item.product.image) {
        return item.product.image;
      }
    }
    
    // Check if item itself has image
    if (item.image) {
      return item.image;
    }
    
    // Last fallback
    return 'https://via.placeholder.com/50';
  };

  // Render loading state
  if (loading) {
    return (
      <div className="admin-order-detail-container">
        <div className="loading-state">
          <FaSpinner className="loading-icon fa-spin" />
          <h2>Loading Order Details</h2>
          <p>Please wait while we fetch the order data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="admin-order-detail-container">
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <h2>Failed to Load Order Details</h2>
          <p>{error}</p>
          <Link to="/admin/orders" className="back-button">
            <FaArrowLeft /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // If no order found
  if (!order) {
    return (
      <div className="admin-order-detail-container">
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <h2>Order Not Found</h2>
          <p>The requested order could not be found.</p>
          <Link to="/admin/orders" className="back-button">
            <FaArrowLeft /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Main render - order details
  return (
    <div className="admin-order-detail-container">
      <div className="order-header">
        <div className="left">
          <Link to="/admin/orders" className="back-button">
            <FaArrowLeft /> Back to Orders
          </Link>
          <h1>Order #{order._id}</h1>
        </div>
        <div className="right">
          <button className="print-button" onClick={handlePrintInvoice}>
            <FaPrint /> Print Invoice
          </button>
        </div>
      </div>
      
      <div className="order-details">
        <div className="order-summary">
          <div className="summary-item">
            <div className="summary-label">Date</div>
            <div className="summary-value">{formatDate(order.createdAt)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Status</div>
            <div className="summary-value">
              <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                {getStatusInfo(order.status).icon}
                <span>{getStatusInfo(order.status).label}</span>
              </span>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total</div>
            <div className="summary-value total">{formatCurrency(order.totalAmount)}</div>
          </div>
        </div>
      </div>
      
      <div className="order-content">
        <div className="order-info-section">
          <div className="order-status-section">
            <h2>Update Status</h2>
            <div className="status-select-container">
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={statusLoading}
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button 
                className="update-status-button" 
                onClick={handleStatusUpdate}
                disabled={statusLoading || order.status === newStatus}
              >
                {statusLoading ? (
                  <>
                    <FaSpinner className="fa-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <FaTruck /> Update Status
                  </>
                )}
              </button>
            </div>
            
            {statusError && (
              <div className="status-error">
                <FaExclamationTriangle />
                <span>{statusError}</span>
              </div>
            )}
            
            {statusSuccess && (
              <div className="status-success">
                <FaCheck />
                <span>Status updated successfully!</span>
              </div>
            )}
          </div>
          
          <div className="order-customer-details">
            <h2>Customer Information</h2>
            <div className="customer-info">
              {order.user && (
                <>
                  <div className="info-item">
                    <FaUser />
                    <span>{order.user.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <FaEnvelope />
                    <span>{order.user.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <FaPhone />
                    <span>{order.user.phone || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="order-address-section">
            <h2>Shipping Information</h2>
            {order.shippingAddress ? (
              <div className="address-details">
                <div className="info-item">
                  <FaMapMarkerAlt />
                  <div className="address">
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>No shipping information available.</p>
            )}
          </div>
          
          <div className="order-payment-section">
            <h2>Payment Information</h2>
            <div className="payment-details">
              <div className="info-item">
                <FaRegCreditCard />
                <span>
                  {order.paymentMethod ? `Payment Method: ${order.paymentMethod}` : 'Payment Method: N/A'}
                </span>
              </div>
              <div className="info-item">
                <FaFileInvoice />
                <span>
                  {order.paymentStatus ? `Payment Status: ${order.paymentStatus}` : 'Payment Status: N/A'}
                </span>
              </div>
              
              {/* Show transaction ID and payment number for mobile payments */}
              {(order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad') && (
                <>
                  {order.paymentDetails?.transactionId && (
                    <div className="info-item">
                      <FaFileInvoice />
                      <span>Transaction ID: {order.paymentDetails.transactionId}</span>
                    </div>
                  )}
                  {order.paymentDetails?.paymentNumber && (
                    <div className="info-item">
                      <FaPhone />
                      <span>Payment Number: {order.paymentDetails.paymentNumber}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="info-item">
                <FaShippingFast />
                <span>
                  {order.shippingMethod ? `Shipping Method: ${order.shippingMethod}` : 'Shipping Method: N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="order-items-section">
          <h2>Order Items</h2>
          <div className="order-items">
            {order.items && order.items.length > 0 ? (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="product-cell">
                        <div className="product-image-container">
                          <img 
                            src={getProductImage(item)}
                            alt={item.name || (item.product && typeof item.product === 'object' ? item.product.name : 'Product')}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/50';
                              console.log('Image failed to load for product:', item.name || 'Unknown product');
                            }}
                          />
                        </div>
                        <div className="product-info">
                          <div className="product-name">
                            {item.name || 
                             (item.product && typeof item.product === 'object' ? item.product.name : null) || 
                             'Product'}
                          </div>
                          <div className="product-id">
                            {item.productId || 
                             (item.product && typeof item.product === 'object' ? item.product._id : item.product) || 
                             'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="variant-cell">
                        {item.variant ? (
                          <>
                            {item.variant.color && <span>Color: {item.variant.color}</span>}
                            {item.variant.size && <span>Size: {item.variant.size}</span>}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="quantity-cell">{item.quantity}</td>
                      <td className="price-cell">{formatCurrency(item.price)}</td>
                      <td className="total-cell">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No items in this order.</p>
            )}
          </div>
          
          <div className="order-totals">
            <div className="totals-row">
              <div className="totals-label">Subtotal</div>
              <div className="totals-value">{formatCurrency(order.subtotal || order.totalAmount)}</div>
            </div>
            
            {order.taxAmount !== undefined && (
              <div className="totals-row">
                <div className="totals-label">Tax</div>
                <div className="totals-value">{formatCurrency(order.taxAmount)}</div>
              </div>
            )}
            
            {order.shippingAmount !== undefined && (
              <div className="totals-row">
                <div className="totals-label">Shipping</div>
                <div className="totals-value">{formatCurrency(order.shippingAmount)}</div>
              </div>
            )}
            
            {order.discountAmount !== undefined && order.discountAmount > 0 && (
              <div className="totals-row discount">
                <div className="totals-label">Discount</div>
                <div className="totals-value">-{formatCurrency(order.discountAmount)}</div>
              </div>
            )}
            
            <div className="totals-row grand-total">
              <div className="totals-label">Total</div>
              <div className="totals-value">{formatCurrency(order.totalAmount)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {order.notes && (
        <div className="order-notes-section">
          <h2>Order Notes</h2>
          <div className="notes-content">
            {order.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail; 