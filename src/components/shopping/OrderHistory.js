import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faCalendarDay, 
  faSpinner, 
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faTruck,
  faClock,
  faShoppingBag,
  faEye,
  faDownload,
  faFilter,
  faSearch,
  faSortAmountDown,
  faMapMarkerAlt,
  faPhone
} from '@fortawesome/free-solid-svg-icons';
import { getUserOrders } from '../../services/api';
import './OrderHistory.css';

/**
 * OrderHistory component displays all past orders for a user
 * Shows order details, status, and allows navigation to order details
 */
const OrderHistory = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('newest');
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders from backend API...');
      const response = await getUserOrders();
      
      // Handle the API response and normalize the data
      let extractedOrders = [];
      
      if (response?.data) {
        // Handle different response structures
        if (Array.isArray(response.data)) {
          extractedOrders = response.data;
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          extractedOrders = response.data.orders;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          extractedOrders = response.data.data;
        } else if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
          // Try to find an array property that might contain orders
          for (const key in response.data) {
            if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
              extractedOrders = response.data[key];
              console.log(`Found orders in response property: ${key}`);
              break;
            }
          }
        }
      }
      
      // If no orders found in any API response format, show appropriate message
      if (extractedOrders.length === 0) {
        console.log('No orders found in API response');
        setOrders([]);
        setError('No orders found. Once you make a purchase, your orders will appear here.');
        setLoading(false);
        return;
      }
      
      // Normalize orders from API data
      const normalizedOrders = extractedOrders.map(order => normalizeOrder(order));
      console.log(`Displaying ${normalizedOrders.length} orders from API`);
      setOrders(normalizedOrders);
      
    } catch (err) {
      console.error('Error fetching orders from API:', err);
      setError('Failed to load your order history. Please try again later.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Normalize order data structure to handle different API responses
  const normalizeOrder = (order) => {
    // Only log if order structure is unusual
    if (!order.id && !order._id && !order.orderId) {
      console.log('Unusual order data structure:', order);
    }
    
    // Helper function to extract product image from various sources
    const getProductImage = (item) => {
      // If item has a product object with colorVariants
      if (item.product && typeof item.product === 'object') {
        // First check for colorVariants array
        if (item.product.colorVariants && 
            Array.isArray(item.product.colorVariants) && 
            item.product.colorVariants.length > 0) {
          
          const colorVariant = item.product.colorVariants[0];
          
          // Check if colorVariant has images array
          if (colorVariant.images && Array.isArray(colorVariant.images) && colorVariant.images.length > 0) {
            const imageData = colorVariant.images[0];
            
            // Handle string or object image data
            if (typeof imageData === 'string') {
              return imageData;
            } else if (imageData && typeof imageData === 'object') {
              return imageData.url || imageData.src || imageData.path || '';
            }
          }
        }
        
        // Also check for a single colorVariant object (not in array)
        if (item.product.colorVariant) {
          if (item.product.colorVariant.images && item.product.colorVariant.images.length > 0) {
            const imageData = item.product.colorVariant.images[0];
            return typeof imageData === 'string' 
              ? imageData 
              : (imageData.url || imageData.src || imageData.path || '');
          }
        }
        
        // Fallback to direct image properties on the product
        if (item.product.image) return item.product.image;
        if (item.product.mainImage) return item.product.mainImage;
        if (item.product.imageUrl) return item.product.imageUrl;
      }
      
      // If item itself has image properties
      if (item.image) return item.image;
      if (item.imageUrl) return item.imageUrl;
      if (item.imgUrl) return item.imgUrl;
      
      // Last resort fallback to a placeholder
      return 'https://via.placeholder.com/80x80';
    };
    
    // Normalize order data
    return {
      id: order.id || order._id || order.orderId || `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: order.orderNumber || order.order_number || order.number || `#${Math.floor(10000 + Math.random() * 90000)}`,
      status: order.status || 'Processing',
      createdAt: order.createdAt || order.created_at || order.date || new Date().toISOString(),
      
      items: Array.isArray(order.items) ? order.items.map(item => {
        // Only log unusual item structures
        if (!item.product && !item.productId && !item.product_id) {
          console.log('Unusual item data structure:', item);
        }
        
        // Check for product name in multiple possible locations
        const itemName = 
          item.name || 
          item.productName || 
          item.product_name || 
          item.title || 
          item.product?.name || 
          item.product?.title || 
          (typeof item.product === 'string' ? item.product : null) ||
          'Product';
        
        return {
          id: item.id || item._id || item.product_id || item.productId || `item-${Math.random().toString(36).substring(2, 7)}`,
          quantity: parseInt(item.quantity || item.qty || 1),
          price: parseFloat(item.price || item.unit_price || 0),
          name: itemName,
          image: getProductImage(item),
          color: item.color || item.variant_color || item.variant?.color || item.attributes?.color || '',
          size: typeof item.size === 'object' ? item.size.name : (item.size || item.variant_size || item.variant?.size || item.attributes?.size || ''),
        };
      }) : [],
      
      total: parseFloat(order.total || order.totalAmount || 0),
      currency: order.currency || '$',
      paymentMethod: order.paymentMethod || order.payment?.method || 'Not specified',
      
      // Add shipping address information
      customer: {
        name: order.customer?.name || order.shippingInfo?.name || '',
        email: order.customer?.email || order.email || '',
        phone: order.customer?.phone || order.shippingInfo?.phone || '',
      },
      shippingAddress: order.shippingAddress || order.address || order.shipping_info || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    };
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time ago (e.g., "2 days ago")
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const pastDate = new Date(dateString);
    const diffTime = Math.abs(now - pastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Less than a week
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      // Less than a month
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else {
      // Month or more
      return formatDate(dateString);
    }
  };
  
  // Format price with proper currency
  const formatPrice = (price, currency = '$') => {
    return `${currency}${parseFloat(price).toFixed(2)}`;
  };
  
  // Handle click on an order
  const handleOrderClick = (orderId, event) => {
    // Prevent event bubbling to avoid ResizeObserver errors
    event.stopPropagation();
    navigate(`/order/${orderId}`);
  };
  
  // Handle click on a product
  const handleProductClick = (productId, event) => {
    // Prevent event bubbling to avoid ResizeObserver errors
    event.stopPropagation();
    navigate(`/product/${productId}`);
  };
  
  // Count products in order
  const countProducts = (items) => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };
  
  // Filter and sort orders
  const getFilteredOrders = () => {
    let filteredOrders = [...orders];
    
    // Apply status filter
    if (filterValue !== 'all') {
      filteredOrders = filteredOrders.filter(order => 
        order.status.toLowerCase() === filterValue.toLowerCase()
      );
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (sortValue === 'newest') {
      filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortValue === 'oldest') {
      filteredOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === 'highest') {
      filteredOrders.sort((a, b) => b.total - a.total);
    } else if (sortValue === 'lowest') {
      filteredOrders.sort((a, b) => a.total - b.total);
    }
    
    return filteredOrders;
  };
  
  // Get CSS class for order status badge
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'processing' || statusLower === 'pending') {
      return 'status-processing';
    } else if (statusLower === 'shipped' || statusLower === 'in transit') {
      return 'status-shipped';
    } else if (statusLower === 'delivered' || statusLower === 'completed') {
      return 'status-delivered';
    } else if (statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'refunded') {
      return 'status-cancelled';
    }
    return 'status-processing';
  };
  
  // Get icon for order status
  const getStatusIcon = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'processing' || statusLower === 'pending') {
      return faClock;
    } else if (statusLower === 'shipped' || statusLower === 'in transit') {
      return faTruck;
    } else if (statusLower === 'delivered' || statusLower === 'completed') {
      return faCheckCircle;
    } else if (statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'refunded') {
      return faTimesCircle;
    }
    return faClock;
  };
  
  // Get small accent color for UI elements based on status
  const getAccentColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'processing' || statusLower === 'pending') {
      return 'var(--yellow)';
    } else if (statusLower === 'shipped' || statusLower === 'in transit') {
      return 'var(--coral)';
    } else if (statusLower === 'delivered' || statusLower === 'completed') {
      return 'var(--navy)';
    }
    return 'var(--medium-gray)';
  };
  
  // Continue shopping button handler
  const handleContinueShopping = () => {
    navigate('/');
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="order-history-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Could Not Load Orders</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Get filtered/sorted orders
  const filteredOrders = getFilteredOrders();
  
  // Render empty state if no orders
  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="empty-orders">
          <FontAwesomeIcon icon={faBox} className="empty-icon" />
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
          <button className="primary-button" onClick={handleContinueShopping}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }
  
  // Render no results state if filters return no orders
  if (filteredOrders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="order-history-header">
          <h1>Order History</h1>
          <div className="filter-controls">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search by order number or product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-dropdown">
              <FontAwesomeIcon icon={faFilter} className="filter-icon" />
              <select value={filterValue} onChange={e => setFilterValue(e.target.value)}>
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="sort-dropdown">
              <FontAwesomeIcon icon={faSortAmountDown} className="sort-icon" />
              <select value={sortValue} onChange={e => setSortValue(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="no-results">
          <FontAwesomeIcon icon={faExclamationTriangle} className="no-results-icon" />
          <h2>No Orders Match Your Filters</h2>
          <p>Try changing your search or filter criteria.</p>
          <button className="secondary-button" onClick={() => {
            setSearchTerm('');
            setFilterValue('all');
            setSortValue('newest');
          }}>
            Clear Filters
          </button>
        </div>
      </div>
    );
  }
  
  // Main render with order list
  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Order History</h1>
        <div className="filter-controls">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order number or product..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select value={filterValue} onChange={e => setFilterValue(e.target.value)}>
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="sort-dropdown">
            <FontAwesomeIcon icon={faSortAmountDown} className="sort-icon" />
            <select value={sortValue} onChange={e => setSortValue(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="orders-list">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-card-header" onClick={(e) => handleOrderClick(order.id, e)}>
              <div className="order-info">
                <div className="order-number">
                  Order {order.orderNumber}
                </div>
                <div className="order-date">
                  <FontAwesomeIcon icon={faCalendarDay} />
                  {formatDate(order.createdAt)}
                  <span className="time-ago">({getTimeAgo(order.createdAt)})</span>
                </div>
              </div>
              
              <div className="order-status">
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  <FontAwesomeIcon icon={getStatusIcon(order.status)} />
                  {order.status}
                </span>
              </div>
            </div>
            
            <div className="order-card-content">
              <div className="order-products">
                <div className="product-count">
                  <FontAwesomeIcon icon={faShoppingBag} />
                  {countProducts(order.items)} {countProducts(order.items) === 1 ? 'item' : 'items'}
                </div>
                
                <div className="product-thumbnails">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className="product-thumbnail"
                      onClick={(e) => handleProductClick(item.id, e)}
                      title={item.name}
                    >
                      <img 
                        src={item.image || 'https://via.placeholder.com/50x50'} 
                        alt={item.name} 
                      />
                      {order.items.length > 3 && index === 2 && (
                        <div className="more-items">+{order.items.length - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Product names list with improved display */}
                <div className="product-names">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div 
                      key={`name-${item.id || index}`} 
                      className="product-name"
                      onClick={(e) => handleProductClick(item.id, e)}
                    >
                      <span className="product-name-text">
                        {item.name !== 'Product' ? item.name : 'Unknown Product'}
                      </span>
                      {(item.color || item.size) && (
                        <span className="product-variant">
                          {item.color && item.size ? `${item.color}, ${typeof item.size === 'object' ? item.size.name : item.size}` : 
                           item.color ? item.color : 
                           item.size ? (typeof item.size === 'object' ? item.size.name : item.size) : ''}
                        </span>
                      )}
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="more-product-names">+{order.items.length - 2} more items</div>
                  )}
                </div>
              </div>
              
              <div className="order-shipment-info">
                {order.customer && order.customer.name && (
                  <div className="shipment-recipient">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="address-icon" />
                    <span>{order.customer.name}</span>
                  </div>
                )}
                
                {order.shippingAddress && order.shippingAddress.street && (
                  <div className="shipment-address">
                    <span>
                      {order.shippingAddress.street}
                      {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                    </span>
                  </div>
                )}
                
                {order.customer && order.customer.phone && (
                  <div className="shipment-phone">
                    <FontAwesomeIcon icon={faPhone} className="phone-icon" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="order-total">
                <div className="total-label">Order Total</div>
                <div className="total-amount">{formatPrice(order.total, order.currency)}</div>
              </div>
            </div>
            
            <div className="order-card-footer">
              <div className="payment-method">
                {order.paymentMethod}
              </div>
              <button className="view-details-button" onClick={(e) => handleOrderClick(order.id, e)}>
                View Details
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory; 