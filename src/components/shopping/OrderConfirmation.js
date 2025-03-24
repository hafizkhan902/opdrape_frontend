import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faSpinner, 
  faExclamationTriangle,
  faMapMarkerAlt,
  faTruck,
  faMoneyBill,
  faCalendarAlt,
  faEnvelope,
  faPhone,
  faHomeAlt,
  faFileAlt,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { getOrderById } from '../../services/api';
import OrderSummary from './OrderSummary';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './OrderConfirmation.css';

/**
 * Generates a random order ID with OPDR prefix
 * @returns {string} Random order ID
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString().substring(7, 13); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4-digit random number
  return `OPDR-${timestamp}-${random}`;
};

/**
 * OrderConfirmation component displays order details after successful checkout
 * Shows order number, status, items, payment and shipping information
 */
const OrderConfirmation = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const [displayOrderId, setDisplayOrderId] = useState(null);
  
  // Handle case where order data is passed through location state
  useEffect(() => {
    if (location.state && location.state.orderData) {
      console.log("Order data from location state:", location.state.orderData);
      
      // Log specific customer and shipping address data for debugging
      console.log("Customer info from state:", location.state.orderData.customer);
      console.log("Shipping address from state:", location.state.orderData.shippingAddress);
      
      const normalizedData = normalizeOrderData(location.state.orderData);
      setOrder(normalizedData);
      
      // Generate a display order ID with OPDR prefix if needed
      ensureOrderId(normalizedData);
      
      setLoading(false);
    } else if (orderId) {
      // Fetch order details if we have an orderId
      console.log("Fetching order from orderId:", orderId);
      fetchOrderDetails(orderId);
    } else {
      console.error("No order data or orderId available");
      setError('Order information is missing');
      setLoading(false);
    }
  }, [location.state, orderId]);
  
  // Ensure we have a valid order ID for display
  const ensureOrderId = (orderData) => {
    // First check if we have a valid orderNumber with OPDR prefix
    if (orderData.orderNumber && orderData.orderNumber.startsWith('OPDR')) {
      setDisplayOrderId(orderData.orderNumber);
      return;
    }
    
    // Otherwise check the order ID
    if (!orderData.id || orderData.id === 'N/A' || orderData.id === '') {
      // Generate a new order ID with OPDR prefix
      const generatedId = generateOrderId();
      console.log("Generated order ID:", generatedId);
      
      // Update the order with the new ID
      setDisplayOrderId(generatedId);
      
      // Try to persist this ID so it's consistent if user refreshes
      try {
        // Store in localStorage to persist it
        const storedOrderIds = JSON.parse(localStorage.getItem('generatedOrderIds') || '{}');
        storedOrderIds[orderData.id || 'latest'] = generatedId;
        localStorage.setItem('generatedOrderIds', JSON.stringify(storedOrderIds));
      } catch (error) {
        console.error("Error saving generated order ID to localStorage:", error);
      }
    } else if (orderData.id.includes('MOCK') || !orderData.id.startsWith('OPDR')) {
      // If it's a mock ID or doesn't have the OPDR prefix, replace it
      const generatedId = generateOrderId();
      console.log("Converting order ID to OPDR format:", orderData.id, "→", generatedId);
      setDisplayOrderId(generatedId);
    } else {
      // Use the provided ID if it looks valid
      setDisplayOrderId(orderData.id);
    }
  };
  
  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true);
      console.log("Fetching order details for ID:", id);
      const response = await getOrderById(id);
      console.log("Raw API response:", response);
      
      if (response && response.data) {
        console.log("Original items structure:", response.data.items);
        const normalizedData = normalizeOrderData(response.data);
        console.log("Final normalized items:", normalizedData.items);
        setOrder(normalizedData);
        
        // Ensure we have a valid order ID
        ensureOrderId(normalizedData);
        
        // Set warning message if mock data is being used
        if (response.data.isMockData || response.statusText?.includes('Mocked')) {
          setWarningMessage('Note: This order contains mock data. Connect to a real API to view actual orders.');
        }
      } else {
        console.error("Invalid response format:", response);
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Could not load order details. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Normalize order data structure to account for different API responses
  const normalizeOrderData = (orderData) => {
    console.log("Raw order data received for normalization:", orderData);
    
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
      return '';
    };
    
    // Generate an order number with OPDR prefix if none exists
    let orderNumber = orderData.orderNumber || orderData.number || '';
    if (!orderNumber || orderNumber === 'N/A') {
      // Use a consistent ID based on the order's real ID or create a new one
      orderNumber = orderData.id && orderData.id !== 'N/A' ? 
        `OPDR-${orderData.id.substring(0, 6)}` : 
        generateOrderId();
      console.log(`Generated order number: ${orderNumber}`);
    } else if (!orderNumber.startsWith('OPDR')) {
      // Add OPDR prefix if it doesn't have one
      orderNumber = `OPDR-${orderNumber}`;
    }
    
    // Try to get user information from localStorage if it's missing in the order data
    let userInfo = {};
    try {
      const storedUserData = localStorage.getItem('user');
      if (storedUserData) {
        userInfo = JSON.parse(storedUserData);
        console.log("Retrieved user info from localStorage:", userInfo);
      }
    } catch (error) {
      console.error("Error retrieving user info from localStorage:", error);
    }

    // Try to get checkout form data from localStorage if it exists
    let checkoutFormData = {};
    try {
      const storedCheckoutData = localStorage.getItem('checkoutFormData');
      if (storedCheckoutData) {
        checkoutFormData = JSON.parse(storedCheckoutData);
        console.log("Retrieved checkout form data from localStorage:", checkoutFormData);
      }
    } catch (error) {
      console.error("Error retrieving checkout form data from localStorage:", error);
    }
    
    // Process items to ensure consistent structure and pricing
    const normalizedItems = Array.isArray(orderData.items) ? orderData.items.map(item => {
      // Handle case where product info might be nested in a 'product' field
      const productInfo = item.product && typeof item.product === 'object' ? item.product : item;
      
      // For price handling, prioritize explicit item price over product price
      const rawPrice = item.price || productInfo.price || 0;
      let price = parseFloat(rawPrice);
      
      // For debugging
      console.log(`Processing item price: Raw=${rawPrice}, Parsed=${price}, Type=${typeof price}`);
      
      // IMPORTANT: Do NOT convert prices automatically 
      // Only convert if explicitly marked as cents or if price format is clearly wrong
      if (item.priceInCents === true || productInfo.priceInCents === true) {
        price = price / 100;
        console.log(`Converted price from cents to dollars because explicitly marked as cents: ${price}`);
      }
      
      return {
        id: item.id || item.productId || item._id || productInfo._id || '',
        name: item.name || item.productName || item.title || 
              productInfo.name || productInfo.productName || productInfo.title || 'Product',
        price: price,
        quantity: parseInt(item.quantity || 1, 10),
        image: getProductImage(item),
        color: item.color || item.variant || productInfo.color || productInfo.variant || '',
        size: typeof item.size === 'object' ? item.size.name : (item.size || productInfo.size || ''),
        subtotal: price * parseInt(item.quantity || 1, 10)
      };
    }) : [];
    
    console.log("Normalized items:", normalizedItems);
    
    // Calculate order totals if not provided
    let subtotal = orderData.subtotal ? parseFloat(orderData.subtotal) : 
                  normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
                  
    let shipping = orderData.shippingCost ? parseFloat(orderData.shippingCost) : 
                  orderData.shipping ? parseFloat(orderData.shipping) : 0;
                  
    let tax = orderData.tax ? parseFloat(orderData.tax) : 
             orderData.taxAmount ? parseFloat(orderData.taxAmount) : 
             subtotal * 0.05; // Default 5% tax if not specified
             
    let discount = orderData.discount ? parseFloat(orderData.discount) : 0;
    
    let total = orderData.total ? parseFloat(orderData.total) : 
               subtotal + shipping + tax - discount;
               
    // ONLY convert values if explicitly marked as cents, not based on size
    if (orderData.subtotalInCents) subtotal /= 100;
    if (orderData.shippingInCents) shipping /= 100;
    if (orderData.taxInCents) tax /= 100;
    if (orderData.discountInCents) discount /= 100;
    if (orderData.totalInCents) total /= 100;
    
    console.log("Calculated order totals:", {
      subtotal, shipping, tax, discount, total
    });
    
    // Parse and extract payment details
    const paymentMethod = orderData.paymentMethod || 
                         orderData.payment?.method || 
                         orderData.payment?.type || 'Not specified';
    
    // Extract mobile payment details from various possible structures                
    let mobileNumber = '', transactionId = '';
    
    // Check all possible paths for mobile payment details
    if (orderData.paymentDetails) {
      mobileNumber = orderData.paymentDetails.paymentNumber || 
                    orderData.paymentDetails.mobileNumber || '';
      transactionId = orderData.paymentDetails.transactionId || '';
    } else if (orderData.payment) {
      mobileNumber = orderData.payment.mobileNumber || 
                    orderData.payment.paymentNumber || 
                    orderData.payment.customerMobileNumber || '';
      transactionId = orderData.payment.transactionId || '';
    } else {
      // Direct properties
      mobileNumber = orderData.mobileNumber || 
                    orderData.paymentNumber || '';
      transactionId = orderData.transactionId || '';
    }
    
    // Check checkout form data as a fallback for mobile payments
    if (paymentMethod.toLowerCase().includes('bkash') || 
        paymentMethod.toLowerCase().includes('nagad')) {
      if (!mobileNumber && checkoutFormData && checkoutFormData.mobileNumber) {
        mobileNumber = checkoutFormData.mobileNumber;
      }
      if (!transactionId && checkoutFormData && checkoutFormData.transactionId) {
        transactionId = checkoutFormData.transactionId;
      }
    }
    
    // Logging for payment details
    console.log("Extracted payment details:", {
      method: paymentMethod,
      mobileNumber,
      transactionId
    });
    
    // Extract data from different possible response structures
    const normalizedOrder = {
      id: orderData.id || orderData._id || orderData.orderId || '',
      orderNumber: orderNumber,
      status: orderData.status || 'Processing',
      createdAt: orderData.createdAt || orderData.date || orderData.orderDate || new Date().toISOString(),
      
      // Enhanced customer information extraction with more fallback options including localStorage data
      customer: {
        name: orderData.customer?.name || 
              orderData.shipping?.fullName || 
              orderData.shippingInfo?.name || 
              orderData.shipping?.name ||
              orderData.fullName ||
              orderData.name ||
              checkoutFormData.fullName ||
              userInfo.name ||
              userInfo.fullName || '',
              
        email: orderData.customer?.email || 
               orderData.shipping?.email || 
               orderData.email || 
               orderData.userEmail ||
               checkoutFormData.email ||
               userInfo.email || '',
               
        phone: orderData.customer?.phone || 
               orderData.shipping?.phone || 
               orderData.shippingInfo?.phone || 
               orderData.phone ||
               orderData.shipping?.phoneNumber ||
               orderData.shippingInfo?.phoneNumber ||
               checkoutFormData.phone ||
               userInfo.phone ||
               userInfo.phoneNumber || '',
      },
      
      // Enhanced shipping address extraction
      shippingAddress: {
        street: extractAddressField(orderData, 'street', 'address', checkoutFormData, userInfo),
        city: extractAddressField(orderData, 'city', null, checkoutFormData, userInfo),
        state: extractAddressField(orderData, 'state', 'province', checkoutFormData, userInfo),
        zipCode: extractAddressField(orderData, 'zipCode', 'postalCode', checkoutFormData, userInfo),
        country: extractAddressField(orderData, 'country', null, checkoutFormData, userInfo) || 'Bangladesh',
      },
      
      payment: {
        method: paymentMethod,
                
        mobileNumber: mobileNumber,
                     
        transactionId: transactionId,
                      
        status: orderData.payment?.status || 
                orderData.payment?.verificationStatus || 
                'Completed',
      },
      
      items: normalizedItems,
      
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      discount: discount,
      total: total,
      
      notes: orderData.notes || orderData.shipping?.notes || orderData.orderNotes || '',
    };
    
    console.log("Fully normalized order data:", normalizedOrder);
    return normalizedOrder;
  };
  
  // Helper function to extract shipping address fields
  const extractAddressField = (orderData, primaryField, alternateField, checkoutFormData, userInfo) => {
    // Check all possible paths for the field
    return orderData.shippingAddress?.[primaryField] || 
           orderData.shipping?.[primaryField] || 
           orderData.shippingInfo?.[primaryField] ||
           orderData[primaryField] ||
           (alternateField && (
             orderData.shippingAddress?.[alternateField] || 
             orderData.shipping?.[alternateField] || 
             orderData.shippingInfo?.[alternateField] ||
             orderData[alternateField]
           )) ||
           checkoutFormData?.[primaryField] ||
           checkoutFormData?.[alternateField] ||
           userInfo?.address?.[primaryField] ||
           (alternateField && userInfo?.address?.[alternateField]) ||
           userInfo?.[primaryField] ||
           (alternateField && userInfo?.[alternateField]) ||
           '';
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format date for receipt (simpler format)
  const formatReceiptDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn(`Invalid amount for currency formatting: ${amount}`);
      return '৳0';
    }
    return `৳${amount.toFixed(2)}`;
  };
  
  // Calculate total function to ensure consistent calculation
  const calculateItemTotal = (item) => {
    if (!item) return 0;
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return price * quantity;
  };
  
  // Calculate order total
  const calculateOrderTotal = (items = []) => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };
  
  // Continue shopping button handler
  const handleContinueShopping = () => {
    navigate('/');
  };
  
  // View all orders button handler
  const handleViewOrders = () => {
    navigate('/account/orders');
  };
  
  // Download receipt as PDF
  const handleDownloadReceipt = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const receiptElement = document.getElementById('receipt-content');
      
      if (!receiptElement) {
        console.error('Receipt element not found');
        return;
      }
      
      // Create a clone to avoid styling issues
      const clone = receiptElement.cloneNode(true);
      clone.style.background = 'white';
      clone.style.padding = '20px';
      clone.style.width = '210mm'; // A4 width
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      const fileName = `order-receipt-${displayOrderId || order.id || 'unknown'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download receipt. Please try again later.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Handle loading state
  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your order information...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="order-confirmation-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Order Information Unavailable</h2>
          <p>{error}</p>
          <div className="action-buttons">
            <button className="secondary-button" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
            <button className="primary-button" onClick={handleViewOrders}>
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no order data is available
  if (!order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>No Order Information</h2>
          <p>We couldn't find details for this order.</p>
          <div className="action-buttons">
            <button className="secondary-button" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main render with order details
  return (
    <div className="order-confirmation-container">
      {/* Hidden receipt template for PDF generation */}
      <div id="receipt-template" className="receipt-template">
        <h1>Order Summary</h1>
        
        <div className="receipt-section">
          <div className="receipt-row">
            <span className="receipt-label">Order No:</span>
            <span className="receipt-value">{displayOrderId || order.orderNumber || order.id || "N/A"}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{formatReceiptDate(order.createdAt)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Email:</span>
            <span className="receipt-value">{order.customer.email || "Not provided"}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Phone:</span>
            <span className="receipt-value">{order.customer.phone || "Not provided"}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Total:</span>
            <span className="receipt-value">{formatCurrency(order.total)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Payment Method:</span>
            <span className="receipt-value">{order.payment.method}</span>
          </div>
        </div>
        
        <h2>Order Details</h2>
        
        <div className="receipt-section">
          <div className="receipt-table">
            <div className="receipt-table-header">
              <div className="receipt-col-product">Product</div>
              <div className="receipt-col-price">Price</div>
            </div>
            
            {order.items.map((item, index) => (
              <div key={item.id || index} className="receipt-table-row">
                <div className="receipt-col-product">
                  {item.name} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
                  {(item.color || item.size) && (
                    <div className="receipt-variant">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.color && item.size && ', '}
                      {item.size && <span>Size: {typeof item.size === 'object' ? item.size.name : item.size}</span>}
                    </div>
                  )}
                </div>
                <div className="receipt-col-price">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
            
            <div className="receipt-table-footer">
              <div className="receipt-col-product">Total</div>
              <div className="receipt-col-price">{formatCurrency(order.total)}</div>
            </div>
          </div>
        </div>
        
        <h2>Payment Details</h2>
        
        <div className="receipt-section payment-details">
          <table className="payment-amounts">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>{formatCurrency(order.subtotal)}</td>
              </tr>
              
              {order.discount > 0 && (
                <tr className="discount">
                  <td>Discount</td>
                  <td>-{formatCurrency(order.discount)}</td>
                </tr>
              )}
              
              <tr>
                <td>Tax</td>
                <td>{formatCurrency(order.tax)}</td>
              </tr>
              
              <tr>
                <td>Shipping</td>
                <td>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</td>
              </tr>
              
              <tr className="total-amount">
                <td>Total Amount</td>
                <td>{formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h2>Shipping Address</h2>
        
        <div className="receipt-section billing-address">
          <div className="address-content">
            <p className="customer-name">{order.customer.name || 'Customer'}</p>
            <p>{order.shippingAddress.street || 'Address not provided'}</p>
            <p>
              {order.shippingAddress.city || 'City not provided'}
              {order.shippingAddress.city && order.shippingAddress.state ? ', ' : ' '}
              {order.shippingAddress.state || 'State not provided'} {order.shippingAddress.zipCode || ''}
            </p>
            <p>{order.shippingAddress.country || 'Bangladesh'}</p>
            <p><strong>Phone:</strong> {order.customer.phone || 'Not provided'}</p>
          </div>
        </div>
        
        <h2>Billing Address</h2>
        
        <div className="receipt-section billing-address">
          <div className="address-content">
            <p className="customer-name">{order.customer.name || 'Customer'}</p>
            <p>{order.shippingAddress.street || 'Address not provided'}</p>
            <p>
              {order.shippingAddress.city || 'City not provided'}
              {order.shippingAddress.city && order.shippingAddress.state ? ', ' : ' '}
              {order.shippingAddress.state || 'State not provided'} {order.shippingAddress.zipCode || ''}
            </p>
            <p>{order.shippingAddress.country || 'Bangladesh'}</p>
            <p><strong>Phone:</strong> {order.customer.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
      
      <div className="order-confirmation">
        <div id="receipt-content">
          <div className="confirmation-header">
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <h1>Order Confirmed!</h1>
            <p className="confirmation-message">
              Thank you for your purchase. We have received your order and are processing it now.
            </p>
            <div className="order-info">
              <div className="order-number">
                <span>Order #:</span> <strong>{displayOrderId || order.orderNumber || order.id || "N/A"}</strong>
              </div>
              <div className="order-date">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Placed on:</span> {formatDate(order.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="confirmation-details">
            <div className="confirmation-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faFileAlt} />
                Order Details
              </h3>
              
              <div className="order-status">
                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="customer-info">
                <div className="info-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <div>
                    <label>Email:</label>
                    <span>{order.customer.email || 'Not provided'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <div>
                    <label>Phone:</label>
                    <span>{order.customer.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="confirmation-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                Shipping Address
              </h3>
              <div className="address-details">
                <p className="customer-name">{order.customer.name || 'Customer'}</p>
                <p>{order.shippingAddress.street || 'Address not provided'}</p>
                <p>
                  {order.shippingAddress.city || 'City not provided'}
                  {order.shippingAddress.city && order.shippingAddress.state ? ', ' : ' '}
                  {order.shippingAddress.state || 'State not provided'} {order.shippingAddress.zipCode || ''}
                </p>
                <p>{order.shippingAddress.country || 'Bangladesh'}</p>
                <p><strong>Phone:</strong> {order.customer.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="confirmation-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faMoneyBill} />
                Payment Information
              </h3>
              <div className="payment-details">
                <table className="payment-amounts">
                  <tbody>
                    <tr>
                      <td>Payment Method</td>
                      <td className={`method-${order.payment.method.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.payment.method}
                      </td>
                    </tr>
                    
                    {/* Show mobile payment details for bKash or Nagad */}
                    {(order.payment.method.toLowerCase().includes('bkash') || 
                     order.payment.method.toLowerCase().includes('nagad')) ? (
                      <>
                        {order.payment.mobileNumber && (
                          <tr>
                            <td>Mobile Number</td>
                            <td>{order.payment.mobileNumber}</td>
                          </tr>
                        )}
                        {order.payment.transactionId && (
                          <tr>
                            <td>Transaction ID</td>
                            <td>{order.payment.transactionId}</td>
                          </tr>
                        )}
                      </>
                    ) : null}
                    
                    <tr>
                      <td>Payment Status</td>
                      <td className={`status-${order.payment.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.payment.status}
                      </td>
                    </tr>
                    
                    <tr className="subtotal">
                      <td>Subtotal</td>
                      <td>{formatCurrency(order.subtotal)}</td>
                    </tr>
                    
                    {order.discount > 0 && (
                      <tr className="discount">
                        <td>Discount</td>
                        <td>-{formatCurrency(order.discount)}</td>
                      </tr>
                    )}
                    
                    <tr>
                      <td>Tax</td>
                      <td>{formatCurrency(order.tax)}</td>
                    </tr>
                    
                    <tr>
                      <td>Shipping</td>
                      <td>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</td>
                    </tr>
                    
                    <tr className="total-amount">
                      <td>Total Amount</td>
                      <td>{formatCurrency(order.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="confirmation-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faTruck} />
                Shipping Information
              </h3>
              <div className="shipping-details">
                <table className="payment-amounts">
                  <tbody>
                    <tr>
                      <td>Shipping Method</td>
                      <td>Standard Shipping</td>
                    </tr>
                    <tr>
                      <td>Estimated Delivery</td>
                      <td>3-5 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Items */}
            <div className="confirmation-section">
              <h3 className="section-title">
                <FontAwesomeIcon icon={faFileAlt} />
                Items Ordered
              </h3>
              <div className="order-items">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={item.id || index} className="item-row">
                        <td className="item-name">
                          <div className="item-info">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="item-thumbnail" />
                            ) : (
                              <div className="item-thumbnail-placeholder"></div>
                            )}
                            <div className="item-details">
                              <span className="item-title">{item.name}</span>
                              {(item.color || item.size) && (
                                <div className="item-variant">
                                  {item.color && <span>Color: {item.color}</span>}
                                  {item.color && item.size && ' / '}
                                  {item.size && <span>Size: {typeof item.size === 'object' ? item.size.name : item.size}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="item-price">{formatCurrency(item.price)}</td>
                        <td className="item-quantity">{item.quantity}</td>
                        <td className="item-total">{formatCurrency(calculateItemTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="order-items-summary">
            {/* OrderSummary component removed as it's redundant */}
          </div>
          
          {order.notes && (
            <div className="order-notes">
              <h3>Order Notes</h3>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          <button className="secondary-button" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
          <button 
            className="primary-button download-button" 
            onClick={handleDownloadReceipt}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Generating PDF...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} />
                Download Receipt
              </>
            )}
          </button>
          <button className="secondary-button" onClick={handleViewOrders}>
            View My Orders
          </button>
        </div>
      </div>
      
      {warningMessage && !loading && !error && (
        <div className="warning-message" style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', margin: '10px 0', borderRadius: '4px', textAlign: 'center' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmation; 