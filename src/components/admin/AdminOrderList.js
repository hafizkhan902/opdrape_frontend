import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../../services/api';
import './AdminOrderList.css';
import { 
  FaSearch, FaFilter, FaSort, FaEye, FaSpinner, 
  FaExclamationTriangle, FaShoppingBag, FaSearch as FaSearchThin,
  FaCheck, FaTruck, FaBoxOpen, FaTimesCircle, FaClock, FaCreditCard, FaEdit
} from 'react-icons/fa';

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  const navigate = useNavigate();

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

  // Memoized fetchOrders function to avoid unnecessary re-renders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare query parameters based on filters
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      // Set sort parameter based on user selection
      switch(sortBy) {
        case 'newest':
          params.sort = '-createdAt';
          break;
        case 'oldest':
          params.sort = 'createdAt';
          break;
        case 'highestAmount':
          params.sort = '-totalAmount';
          break;
        case 'lowestAmount':
          params.sort = 'totalAmount';
          break;
        default:
          params.sort = '-createdAt';
      }

      const response = await getAdminOrders(params);
      
      // Handle different response formats
      let orderData = [];
      if (response.data && Array.isArray(response.data)) {
        orderData = response.data;
      } else if (response.data && response.data.orders && Array.isArray(response.data.orders)) {
        orderData = response.data.orders;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find an array property in the response
        const arrayProps = Object.entries(response.data)
          .find(([key, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          orderData = arrayProps[1];
        }
      }
      
      setOrders(orderData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  // Fetch orders from API when component mounts or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle order status update
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || 'pending');
    setShowStatusModal(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      await updateOrderStatus(selectedOrder._id, newStatus);
      setUpdateSuccess(true);
      
      // Update the order in the list with the new status
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: newStatus } 
          : order
      ));
      
      // Close modal after success
      setTimeout(() => {
        setShowStatusModal(false);
        setSelectedOrder(null);
        setUpdateSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating order status:', err);
      setUpdateError('Failed to update the order status. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Cancel status update and reset state
  const cancelStatusUpdate = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const orderIdMatch = order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const customerMatch = order.user && order.user.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = order.user && order.user.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return orderIdMatch || customerMatch || emailMatch;
  });

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
      day: 'numeric'
    }).format(date);
  };

  // Format order ID for display
  const formatOrderId = (id) => {
    if (!id) return 'N/A';
    
    // Use the last 6 characters of the ID and convert to a number base 36
    const shortId = parseInt(id.slice(-6), 16).toString(36).toUpperCase();
    
    // Combine with prefix
    return `OPDR${shortId}`;
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

  // Navigation function
  const viewOrderDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // Render loading state
  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders-container">
        <div className="loading-state">
          <FaSpinner className="loading-icon fa-spin" />
          <h2>Loading Orders</h2>
          <p>Please wait while we fetch the order data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && orders.length === 0) {
    return (
      <div className="admin-orders-container">
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <h2>Failed to Load Orders</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={fetchOrders}>
            <FaSearch /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
    return (
      <div className="admin-orders-container">
        <div className="admin-orders-header">
          <h1>Orders</h1>
        </div>
        
        <div className="empty-state">
          <FaShoppingBag className="empty-icon" />
          <h2>No Orders Found</h2>
          <p>There are no orders in the system yet.</p>
        </div>
      </div>
    );
  }

  // Render no results state
  if (filteredOrders.length === 0) {
    return (
      <div className="admin-orders-container">
        <div className="admin-orders-header">
          <h1>Orders</h1>
        </div>
        
        <div className="orders-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <div className="status-filter">
              <FaFilter className="filter-icon" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-options">
              <FaSort className="sort-icon" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestAmount">Amount: High to Low</option>
                <option value="lowestAmount">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="no-results-state">
          <FaSearchThin className="no-results-icon" />
          <h2>No Orders Found</h2>
          <p>No orders match your search criteria. Try adjusting your filters or search term.</p>
          <button className="secondary-button" onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
          }}>
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  // Main render - orders list
  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <h1>Orders</h1>
      </div>
      
      <div className="orders-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by order ID, customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="status-filter">
            <FaFilter className="filter-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {orderStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sort-options">
            <FaSort className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highestAmount">Amount: High to Low</option>
              <option value="lowestAmount">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id || order._id}>
                <td className="order-id">
                  {order.id || order._id}
                </td>
                <td className="order-date">
                  {formatDate(order.createdAt)}
                </td>
                <td className="order-customer">
                  <div className="customer-name">{order.customer?.name || order.user?.name || 'N/A'}</div>
                  <div className="customer-email">{order.customer?.email || order.user?.email || 'N/A'}</div>
                </td>
                <td className="order-items">
                  {order.items?.length || 0}
                </td>
                <td className="order-total">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="order-status">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusInfo(order.status).label}
                  </span>
                </td>
                <td className="order-actions">
                  <button 
                    className="action-button view" 
                    onClick={() => viewOrderDetails(order.id || order._id)}
                    title="View Order"
                  >
                    <FaEye />
                  </button>
                  <button 
                    className="action-button update-status" 
                    onClick={() => openStatusModal(order)}
                    title="Update Status"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="status-modal">
            {updateSuccess ? (
              <div className="update-success">
                <FaCheck className="success-icon" />
                <h2>Status Updated</h2>
                <p>The order status was successfully updated.</p>
              </div>
            ) : (
              <>
                <h2>Update Order Status</h2>
                <p>
                  Change the status for Order <strong>{selectedOrder?._id}</strong>
                </p>
                
                <div className="status-select">
                  <label htmlFor="status">New Status:</label>
                  <select 
                    id="status"
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {orderStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {updateError && (
                  <div className="update-error">
                    <FaExclamationTriangle />
                    <p>{updateError}</p>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button 
                    className="secondary-button" 
                    onClick={cancelStatusUpdate} 
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="primary-button" 
                    onClick={handleStatusUpdate}
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <FaSpinner className="fa-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <FaCheck /> Update Status
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderList; 