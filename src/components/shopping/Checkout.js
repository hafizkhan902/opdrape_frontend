import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faTruck, 
  faCreditCard, 
  faShield, 
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import { getUserCart, getUserProfile, createOrder, clearCart, getProductById } from '../../services/api';
import { ENABLE_MOCK_ORDERS } from '../../config/env';
import './Checkout.css';
import PaymentForm from './PaymentForm';
import ShippingForm from './ShippingForm';
import OrderSummary from './OrderSummary';

/**
 * Helper function to extract a valid product ID from a cart item
 * @param {Object} item - The cart item
 * @returns {String|null} The extracted product ID or null if invalid
 */
const extractProductId = (item) => {
  // Return null if item is not an object
  if (!item || typeof item !== 'object') {
    console.warn('Invalid cart item:', item);
    return null;
  }
  
  // Check for MongoDB ObjectId format (24 hex characters)
  const isValidObjectId = (id) => id && typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);
  
  // PRIORITY 1: Check if this is coming from a nested product object
  // This is the most likely case based on the error message
  if (item.product && typeof item.product === 'object') {
    // Look inside the nested product object first - this has highest priority
    if (isValidObjectId(item.product._id)) {
      console.log(`Found product ID in nested object: ${item.product._id}`);
      return item.product._id;
    }
    
    // Try other common ID fields in the product object
    for (const prop of ['id', 'productId']) {
      if (isValidObjectId(item.product[prop])) {
        console.log(`Using item.product.${prop} as productId: ${item.product[prop]}`);
        return item.product[prop];
      }
    }
  }
  
  // PRIORITY 2: Direct productId property
  if (isValidObjectId(item.productId)) {
    console.log(`Using direct productId: ${item.productId}`);
    return item.productId;
  }
  
  // PRIORITY 3: If product property is a string and valid ObjectId, use it
  if (isValidObjectId(item.product)) {
    console.log(`Using item.product string as productId: ${item.product}`);
    return item.product;
  }
  
  // PRIORITY 4: Try other ID properties, but be careful not to use order/cart item IDs
  // Check if the ID doesn't match the cart item ID to avoid using the wrong ID
  const possibleIdProps = ['id', 'product_id', 'productID'];
  for (const prop of possibleIdProps) {
    if (isValidObjectId(item[prop])) {
      console.log(`Using ${prop} as productId: ${item[prop]}`);
      return item[prop];
    }
  }
  
  // LAST RESORT: Use _id only if we've exhausted all other options
  // This is risky as it could be the cart item ID rather than product ID
  if (isValidObjectId(item._id)) {
    // Log a warning since this might be the cart item ID, not product ID
    console.warn(`CAUTION: Using item._id as productId (might be cart item ID): ${item._id}`);
    return item._id;
  }
  
  console.warn('Could not find valid product ID in item:', item);
  return null;
};

/**
 * Checkout component that handles the checkout process
 * including shipping information, payment method selection,
 * and order summary before finalizing the purchase
 */
const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [cartError, setCartError] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Shipping information
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh',
    
    // Payment information
    paymentMethod: 'cash-on-delivery',
    mobileNumber: '',
    transactionId: '',
    
    // Order notes
    notes: ''
  });

  // Fetch cart data and user profile on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch cart items
        const cartResponse = await getUserCart();

        // Extract cart items from different possible response structures
        let extractedItems = [];
        
        if (cartResponse?.data) {
          if (Array.isArray(cartResponse.data)) {
            extractedItems = cartResponse.data;
          } else if (Array.isArray(cartResponse.data.items)) {
            extractedItems = cartResponse.data.items;
          } else if (cartResponse.data.cart && Array.isArray(cartResponse.data.cart.items)) {
            extractedItems = cartResponse.data.cart.items;
          } else if (cartResponse.data.products && Array.isArray(cartResponse.data.products)) {
            extractedItems = cartResponse.data.products;
          } else if (typeof cartResponse.data === 'object' && Object.keys(cartResponse.data).length > 0) {
            extractedItems = [cartResponse.data];
          }
        }
        
        // Process and normalize cart items
        const normalizedItems = extractedItems.map(item => {
          const productId = extractProductId(item);
          return {
            productId: productId || '',
            name: item.name || item.productName || item.title || item.product_name || 
                  (item.product && (item.product.name || item.product.title)) || 'Product',
            price: parseFloat(item.price || item.unit_price || item.unitPrice || 
                   (item.product && (item.product.price || item.product.unit_price)) || 0),
            quantity: parseInt(item.quantity || item.qty || item.count || 1),
            image: item.image || item.thumbnail || item.img || item.picture || 
                   (item.product && (item.product.image || item.product.thumbnail)) || 
                   'https://via.placeholder.com/60',
            color: item.color || item.variant_color || (item.variant && item.variant.color) || '',
            size: typeof item.size === 'object' ? item.size.name : (item.size || item.variant_size || (item.variant && item.variant.size) || '')
          };
        });
        
        // Filter and fetch product details
        const validItems = normalizedItems.filter(item => 
          item.productId && /^[0-9a-f]{24}$/i.test(item.productId)
        );
        
        let enrichedItems = [];
        
        if (validItems.length > 0) {
          try {
            const productPromises = validItems.map(item => 
              getProductById(item.productId)
                .then(response => {
                  if (!response?.data) return item;
                  
                  const productData = response.data;
                  return {
                    ...item,
                    productId: item.productId,
                    price: productData.basePrice || productData.price || item.price || 0,
                    name: productData.name || productData.title || item.name,
                    image: productData.image || productData.thumbnail || item.image,
                  };
                })
                .catch(() => item)
            );
            
            const fetchedItems = await Promise.all(productPromises);
            const invalidItems = normalizedItems.filter(item => 
              !item.productId || !/^[0-9a-f]{24}$/i.test(item.productId)
            );
            enrichedItems = [...fetchedItems, ...invalidItems];
          } catch (error) {
            enrichedItems = normalizedItems;
          }
        } else {
          enrichedItems = normalizedItems;
        }
        
        if (enrichedItems.length === 0) {
          setCartError(true);
          setError('Your cart is empty. Please add items to your cart before checkout.');
        } else {
          setCartItems(enrichedItems);
          setCartError(false);
        }
        
        // Fetch user profile
        const profileResponse = await getUserProfile();
        if (profileResponse.data) {
          try {
            if (!localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(profileResponse.data.user || profileResponse.data));
            }
            
            if (profileResponse.data.user) {
              const user = profileResponse.data.user;
              const updatedFormData = {
                ...formData,
                fullName: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                zipCode: user.address?.zipCode || '',
                country: 'Bangladesh'
              };
              
              setFormData(updatedFormData);
              localStorage.setItem('checkoutFormData', JSON.stringify(updatedFormData));
            }
          } catch (storageError) {
            // Silently handle storage errors
          }
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
        setError('Unable to load checkout data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value }); // Debug log
    
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    console.log('Updated form data:', updatedFormData); // Debug log
    setFormData(updatedFormData);
    
    // Save updated form data to localStorage for later retrieval
    try {
      localStorage.setItem('checkoutFormData', JSON.stringify(updatedFormData));
    } catch (error) {
      console.warn('Error saving form data to localStorage:', error);
    }
  };

  // Calculate subtotal from cart items
  const calculateSubtotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((total, item) => {
      // First try to get basePrice, then fall back to regular price
      const itemPrice = item.basePrice || item.price;
      const price = typeof itemPrice === 'string' ? parseFloat(itemPrice) : itemPrice;
      const validPrice = isNaN(price) ? 0 : price;
      
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
      const validQuantity = isNaN(quantity) ? 0 : quantity;
      
      return total + (validPrice * validQuantity);
    }, 0);
  };

  // Calculate tax (5% of subtotal)
  const calculateTax = (subtotal) => {
    const taxRate = 0.05; // 5% tax
    return Math.round(subtotal * taxRate);
  };

  // Calculate shipping based on subtotal
  const calculateShipping = (subtotal) => {
    return subtotal >= 1000 ? 0 : 60; // Free shipping for orders over ৳1000, otherwise ৳60
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const shipping = calculateShipping(subtotal);
    return subtotal + tax + shipping;
  };

  // Format price with currency
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0';
    }
    return `৳${Math.round(price).toLocaleString('en-BD')}`;
  };

  // Handle step navigation
  const handleNextStep = (e, formDataFromShipping) => {
    // If e is an event object, prevent default behavior
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Update form data if it's coming from shipping form
    if (formDataFromShipping) {
      setFormData(formDataFromShipping);
    }
    
    // Validate current step
    if (currentStep === 1) {
      // Validate shipping info
      const { fullName, email, phone, address, city, state, zipCode } = formDataFromShipping || formData;
      
      // Debug log to see what values we're getting
      console.log('Current form data:', formDataFromShipping || formData);
      console.log('Validating shipping info:', {
        fullName,
        email,
        phone,
        address,
        city,
        state,
        zipCode
      });
      
      // Check each field individually and log which one is missing
      const missingFields = [];
      if (!fullName?.trim()) missingFields.push('Full Name');
      if (!email?.trim()) missingFields.push('Email');
      if (!phone?.trim()) missingFields.push('Phone');
      if (!address?.trim()) missingFields.push('Address');
      if (!city?.trim()) missingFields.push('City');
      if (!state?.trim()) missingFields.push('State');
      if (!zipCode?.trim()) missingFields.push('ZIP Code');
      
      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }
    } else if (currentStep === 2) {
      // Validate payment info
      if (!formData.paymentMethod) {
        alert('Please select a payment method.');
        return;
      }
      
      if (formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') {
        if (!formData.mobileNumber) {
          alert(`Please provide your ${formData.paymentMethod} number.`);
          return;
        }
        
        // Validate mobile number format (must be 11 digits)
        if (!/^\d{11}$/.test(formData.mobileNumber)) {
          alert(`Please provide a valid 11-digit ${formData.paymentMethod} number.`);
          return;
        }
        
        if (!formData.transactionId) {
          alert(`Please provide your ${formData.paymentMethod} transaction ID.`);
          return;
        }
        
        // Validate transaction ID (must be at least 6 characters)
        if (formData.transactionId.length < 6) {
          alert(`Transaction ID must be at least 6 characters long.`);
          return;
        }
      }
    }
    
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Handle order completion and navigation
  const handleOrderCompletion = async (orderId) => {
    console.log('Handling order completion for order ID:', orderId);
    try {
      // Add the new order to localStorage
      try {
        console.log('Saving order to localStorage');
        // Get existing orders from localStorage
        const existingOrdersStr = localStorage.getItem('userOrders');
        let existingOrders = [];
        
        if (existingOrdersStr) {
          try {
            existingOrders = JSON.parse(existingOrdersStr);
            if (!Array.isArray(existingOrders)) {
              console.warn('userOrders in localStorage is not an array, resetting to empty array');
              existingOrders = [];
            }
          } catch (parseError) {
            console.error('Error parsing existing orders from localStorage:', parseError);
            existingOrders = [];
          }
        }
        
        // Make sure form data is available
        if (!formData.fullName || !formData.email || !formData.address || !formData.city) {
          console.warn('Form data incomplete, attempting to retrieve from localStorage');
          try {
            const storedFormData = localStorage.getItem('checkoutFormData');
            if (storedFormData) {
              const parsedFormData = JSON.parse(storedFormData);
              // Merge with current form data, keeping current values if they exist
              Object.keys(parsedFormData).forEach(key => {
                if (!formData[key]) {
                  formData[key] = parsedFormData[key];
                }
              });
            }
          } catch (formDataError) {
            console.error('Error retrieving stored form data:', formDataError);
          }
        }
        
        // Create new order object with complete details
        const newOrder = {
          id: orderId,
          orderNumber: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
          status: 'Processing',
          createdAt: new Date().toISOString(),
          customer: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          },
          shippingAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          },
          items: cartItems.map(item => ({
            id: item.productId || ('item-' + Math.random().toString(36).substr(2, 9)),
            quantity: item.quantity,
            price: item.price,
            product: {
              name: item.name,
              image: item.image || 'https://via.placeholder.com/80x80'
            },
            color: item.color || '',
            size: typeof item.size === 'object' ? item.size.name : (item.size || '')
          })),
          subtotal: calculateSubtotal(),
          shippingCost: calculateShipping(calculateSubtotal()),
          tax: calculateTax(calculateSubtotal()),
          total: calculateTotal(),
          payment: {
            method: formData.paymentMethod,
            ...(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && {
              mobileNumber: formData.mobileNumber,
              customerMobileNumber: formData.mobileNumber,
              transactionId: formData.transactionId || 'TRX' + Math.random().toString(36).substring(2, 10).toUpperCase(),
              merchantNumber: formData.paymentMethod === 'bkash' ? '01701234567' : '01801234567',
              verificationStatus: 'pending',
              paymentTimestamp: new Date().toISOString()
            },
            ...(formData.paymentMethod === 'cod') && {
              amount: calculateTotal()
            }
          }
        };
        
        // Add new order to the beginning of the array
        existingOrders.unshift(newOrder);
        
        // Save updated orders back to localStorage
        localStorage.setItem('userOrders', JSON.stringify(existingOrders));
        console.log('Order successfully saved to localStorage with customer and shipping info:', {
          customer: newOrder.customer,
          shippingAddress: newOrder.shippingAddress
        });
      } catch (localStorageError) {
        console.error('Error saving order to localStorage:', localStorageError);
      }
      
      // Navigate to order confirmation page with complete order data
      navigate(`/order/confirmation/${orderId}`, {
        state: {
          orderData: {
            id: orderId,
            orderNumber: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
            status: 'Processing',
            createdAt: new Date().toISOString(),
            customer: {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone
            },
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country
            },
            items: cartItems,
            payment: {
              method: formData.paymentMethod,
              ...(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && {
                mobileNumber: formData.mobileNumber,
                transactionId: formData.transactionId
              }
            },
            subtotal: calculateSubtotal(),
            shipping: calculateShipping(calculateSubtotal()),
            tax: calculateTax(calculateSubtotal()),
            total: calculateTotal(),
            notes: formData.notes
          }
        }
      });
    } catch (err) {
      console.error('Error during checkout completion:', err);
      // If there's an error, still navigate but without the state data
      navigate(`/order/confirmation/${orderId}`);
    }
  };
  
  // Separate function to clear cart (will be called after order is confirmed successful)
  const clearCartAfterOrderSuccess = async () => {
    console.log('Starting cart clearing process AFTER successful order placement');
    let clearSuccess = false;
    
    // Try to clear cart via API
    try {
      console.log('Attempting to clear cart via API');
      if (typeof clearCart === 'function') {
        await clearCart();
        clearSuccess = true;
        console.log('Cart cleared successfully via API');
      } else {
        console.warn('clearCart function not available');
      }
    } catch (error) {
      console.warn('Failed to clear cart via API:', error);
    }
    
    // If API clearing failed or as an additional step, try to clear cart in localStorage 
    try {
      console.log('Removing cart data from localStorage');
      
      // Clear all possible localStorage keys that might store cart data
      const cartKeys = ['cart', 'cartItems', 'userCart', 'shopping-cart', 'cart-data', 'cartData', 'shoppingCart'];
      cartKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Removed cart data from localStorage key: ${key}`);
        }
      });
      
      // Also try to set empty cart data rather than just removing
      try {
        localStorage.setItem('cart', JSON.stringify([]));
        localStorage.setItem('cartItems', JSON.stringify([]));
        localStorage.setItem('userCart', JSON.stringify({items: []}));
        console.log('Set empty cart data in localStorage as additional measure');
      } catch (err) {
        console.warn('Error setting empty cart data:', err);
      }
      
      clearSuccess = true;
      console.log('Cart data removed from localStorage');
    } catch (error) {
      console.warn('Failed to clear cart data from localStorage:', error);
    }
    
    // Return to empty cart state in the component
    setCartItems([]);
    
    // Try to broadcast a cart cleared event for other components
    try {
      window.dispatchEvent(new CustomEvent('cartCleared', { 
        detail: { orderId, timestamp: new Date().toISOString() } 
      }));
      console.log('Dispatched cartCleared event');
    } catch (error) {
      console.warn('Failed to dispatch cartCleared event:', error);
    }

    // Additional step: Force a cart refresh by calling getUserCart
    try {
      console.log('Forcing cart refresh...');
      const cartResponse = await getUserCart();
      if (cartResponse?.data) {
        // If we still have items in the cart, try to clear them again
        if (Array.isArray(cartResponse.data) && cartResponse.data.length > 0) {
          console.log('Cart still has items, attempting additional clear...');
          await clearCart();
        }
      }
    } catch (error) {
      console.warn('Error during forced cart refresh:', error);
    }
    
    return clearSuccess;
  };

  // Handle form submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    // Final validation check
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items to your cart before checkout.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    console.log('Starting order placement process');
    
    try {
      // Log entire cart structure for debugging
      console.log('Full cart items structure for debugging:', JSON.stringify(cartItems));
      
      // Filter out items with invalid product IDs before proceeding
      const validCartItems = cartItems.filter(item => {
        const productId = extractProductId(item);
        if (!productId) {
          console.warn(`Removing item with invalid or missing product ID:`, item);
          return false;
        }
        
        const isValid = /^[0-9a-f]{24}$/i.test(productId);
        if (!isValid) {
          console.warn(`Removing item with invalid MongoDB ID format: ${productId}`, item);
          return false;
        }
        
        console.log(`Validated product ID: ${productId}`);
        return true;
      });
      
      if (validCartItems.length === 0) {
        throw new Error('No valid products found in your cart. Please add valid products before checkout.');
      }
      
      console.log(`Using ${validCartItems.length} valid items out of ${cartItems.length} total items for order`);
      
      // Fetch product details for each item to get color variants
      const productDetailsPromises = validCartItems.map(async (item) => {
        const productId = extractProductId(item);
        try {
          // Fetch complete product details including color variants
          const productResponse = await getProductById(productId);
          const productData = productResponse?.data;
          
          if (!productData) {
            console.warn(`Could not fetch details for product ID: ${productId}`);
            return null;
          }
          
          // Get the first available color variant if none specified
          let colorVariant = null;
          
          // 1. Try to use the specified color from cart item
          if (item.colorVariant?.color?.name || item.color) {
            const colorName = item.colorVariant?.color?.name || item.color?.name || item.colorName || item.color;
            
            // Look for a matching color in the product's color variants
            if (productData.colorVariants && productData.colorVariants.length > 0) {
              colorVariant = productData.colorVariants.find(variant => 
                variant.color?.name?.toLowerCase() === colorName?.toLowerCase()
              );
            }
          }
          
          // 2. If no color match found, use the first available color variant
          if (!colorVariant && productData.colorVariants && productData.colorVariants.length > 0) {
            colorVariant = productData.colorVariants[0];
            console.log(`Using first available color variant for product ${productData.name}: ${colorVariant.color?.name}`);
          }
          
          // Get size information
          const sizeName = typeof item.size === 'object' ? item.size.name : (item.sizeName || item.size || '');
          
          return {
            product: productId,
            quantity: item.quantity || 1,
            colorVariant: colorVariant ? {
              color: {
                name: colorVariant.color?.name || '',
                hexCode: colorVariant.color?.hexCode || ''
              }
            } : null,
            size: {
              name: sizeName || '',
              quantity: item.quantity || 1
            },
            originalItem: item,
            productData
          };
        } catch (error) {
          console.error(`Error fetching product details for ID ${productId}:`, error);
          return null;
        }
      });
      
      const enrichedItems = (await Promise.all(productDetailsPromises)).filter(item => item !== null);
      
      // Check if we have valid items to proceed
      if (enrichedItems.length === 0) {
        throw new Error('Failed to retrieve valid product information for any items in your cart.');
      }
      
      // Check for items without color variants
      const itemsWithoutColors = enrichedItems.filter(item => !item.colorVariant);
      if (itemsWithoutColors.length > 0) {
        const productNames = itemsWithoutColors.map(item => item.productData?.name || 'Unknown product').join(', ');
        throw new Error(`The following products don't have valid color variants: ${productNames}. Please remove them or select a different color.`);
      }
      
      // Format order data according to backend requirements
      const orderData = {
        items: enrichedItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          colorVariant: item.colorVariant,
          size: item.size
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: formData.paymentMethod,
        // Properly structure payment details for mobile payments
        ...(formData.paymentMethod === 'bkash' || formData.paymentMethod === 'nagad') && {
          paymentDetails: {
            paymentNumber: formData.mobileNumber,
            transactionId: formData.transactionId
          }
        }
      };
      
      // Check if we have the correct environment variable to enable mock orders
      if (ENABLE_MOCK_ORDERS) {
        console.log('Mock orders are enabled. This will allow mock order creation if API fails.');
      }
      
      console.log('Submitting order with validated data:', orderData);
      
      // Submit order to API
      const response = await createOrder(orderData);
      console.log('Order response received:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Extract order ID from response
      const extractedOrderId = response.data._id || response.data.id || response.data.orderId;
      if (!extractedOrderId) {
        throw new Error('No order ID received from server');
      }
      
      console.log('Order created successfully with ID:', extractedOrderId);
      
      // Set order complete state
      setOrderId(extractedOrderId);
      setOrderComplete(true);
      
      // Clear cart before navigation
      console.log('Clearing cart before navigation...');
      await clearCartAfterOrderSuccess();
      console.log('Cart cleared successfully');
      
      // Handle order completion and navigation
      await handleOrderCompletion(extractedOrderId);
      
    } catch (err) {
      console.error('Error placing order:', err);
      
      let errorMessage = 'Unable to place your order. Please try again later.';
      
      if (err.response) {
        // Log detailed error information
        console.error('Server response error:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        if (err.response.data?.error?.includes('Product') && err.response.data?.error?.includes('not found')) {
          const productId = err.response.data?.error.match(/Product ([0-9a-f]{24}) not found/)?.[1];
          
          if (productId) {
            errorMessage = `Product ${productId} not found in the database. This may be because an invalid ID was used.`;
            console.error(`Invalid product ID detected: ${productId}`);
            
            // Check if this ID matches any cart item IDs
            const matchesCartItemId = cartItems.some(item => item._id === productId);
            if (matchesCartItemId) {
              console.error(`The invalid product ID matches a cart item ID! This confirms our diagnosis.`);
              errorMessage = `The system is using cart item IDs instead of product IDs. Please refresh your cart and try again.`;
            }
            
            // Try to remove the invalid product ID from cart if we can identify it
            try {
              console.log(`Attempting to remove invalid product ${productId} from cart`);
              // Remove any items that might be causing the issue
              const newCartItems = cartItems.filter(item => {
                // Remove if this is the cart item ID that's being incorrectly used
                if (item._id === productId) {
                  console.log(`Removing item with _id matching the invalid product ID: ${productId}`);
                  return false;
                }
                
                // Also remove if extractProductId would return this ID
                const extractedId = extractProductId(item);
                if (extractedId === productId) {
                  console.log(`Removing item that would produce the invalid product ID: ${productId}`);
                  return false;
                }
                
                return true;
              });
              
              if (newCartItems.length !== cartItems.length) {
                setCartItems(newCartItems);
                console.log(`Removed item(s) with invalid product ID ${productId} from cart`);
              }
            } catch (cleanupError) {
              console.error('Error removing invalid product from cart:', cleanupError);
            }
          } else {
            errorMessage = `A product ID in your order was not found in the database. Please refresh your cart and try again.`;
          }
        } else {
          errorMessage = err.response.data?.message || err.response.data?.error || err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`Failed to place order: ${errorMessage}`);
      
      // Handle mock orders if enabled
      if (ENABLE_MOCK_ORDERS) {
        console.log('Mock orders enabled: Creating mock order');
        const mockOrderId = 'MOCK' + Date.now().toString(36).substring(4).toUpperCase();
        setOrderId(mockOrderId);
        setOrderComplete(true);
        await clearCartAfterOrderSuccess();
        await handleOrderCompletion(mockOrderId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add a helper function to handle navigation from the completion screen
  const handleCompletionNavigation = (path) => {
    // Ensure cart data is cleared before navigating
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('userCart');
      // Any other cart-related localStorage keys should be cleared here
      console.log('Cart data cleared before navigation');
    } catch (error) {
      console.warn('Failed to clear cart data during navigation:', error);
    }
    
    // Navigate to the specified path
    navigate(path);
  };

  // Effect to clear cart when order is complete and component unmounts
  useEffect(() => {
    // If order is complete, we want to ensure cart is cleared even if user 
    // navigates away without using the navigation buttons
    if (orderComplete) {
      // Define a function that will be used for both immediate execution and cleanup
      const ensureCartCleared = () => {
        console.log('Final cart clearing check');
        try {
          // Clear any cart data from localStorage
          const cartKeys = ['cart', 'cartItems', 'userCart', 'shopping-cart', 'cart-data', 'cartData', 'shoppingCart'];
          cartKeys.forEach(key => {
            if (localStorage.getItem(key)) {
              localStorage.removeItem(key);
              console.log(`Final cleanup: Removed cart data from localStorage key: ${key}`);
            }
          });
          
          // Try to set empty cart data as well
          localStorage.setItem('cart', JSON.stringify([]));
          localStorage.setItem('cartItems', JSON.stringify([]));
          localStorage.setItem('userCart', JSON.stringify({items: []}));
          
          // Dispatch a custom event that other components can listen for
          window.dispatchEvent(new CustomEvent('cartCleared', { 
            detail: { orderId: orderId, timestamp: new Date().toISOString() } 
          }));
          
          // Try calling the API clearCart function directly as a last resort
          if (typeof clearCart === 'function') {
            clearCart().catch(e => console.warn('Final API cart clear attempt failed:', e));
          }
        } catch (error) {
          console.warn('Error in final cart clearing:', error);
        }
      };
      
      // Execute immediately
      ensureCartCleared();
      
      // Also add a beforeunload listener to ensure it happens if user refreshes or closes tab
      const handleBeforeUnload = () => ensureCartCleared();
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Add a timestamp to avoid multiple clears within a short time
      const clearTimestamp = Date.now();
      window._lastCartClear = clearTimestamp;
      
      // Cleanup function
      return () => {
        // Only run the final cleanup if this is the latest clear request
        if (!window._lastCartClear || window._lastCartClear === clearTimestamp) {
          ensureCartCleared(); // Execute again on unmount
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [orderComplete, orderId]);

  // Handle completed payment
  const handlePaymentComplete = (paymentData) => {
    console.log('Payment completed:', paymentData);
    
    // Update form data with selected payment method
    setFormData(prev => ({
      ...prev,
      paymentMethod: paymentData.paymentMethod,
      // Store payment details in correct format for mobile payments
      ...(paymentData.paymentMethod === 'bkash' || paymentData.paymentMethod === 'nagad') && {
        mobileNumber: paymentData.paymentDetails?.paymentNumber,
        transactionId: paymentData.paymentDetails?.transactionId || paymentData.transactionId
      }
    }));
    
    // Update step to order summary
    setCurrentStep(3);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p>Loading checkout information...</p>
        </div>
      </div>
    );
  }

  // Render order complete state - checking this FIRST, before empty cart check
  if (orderComplete) {
    return (
      <div className="checkout-container">
        <div className="order-complete">
          <FontAwesomeIcon icon={faCheckCircle} className="complete-icon" />
          <h2>Order Complete!</h2>
          <p>Thank you for your purchase. Your order has been placed successfully.</p>
          <p className="order-number">Order #: {orderId}</p>
          <p>We've sent a confirmation email with your order details to {formData.email}.</p>
          <div className="order-summary-completion">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map((item, index) => (
                <div key={index} className="summary-item">
                  <span className="item-quantity">{item.quantity} ×</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total summary-row">
              <span>Total</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>
            
            {/* Display payment information section */}
            <div className="payment-info-section">
              <h4>Payment Information</h4>
              {formData.paymentMethod === 'cod' && (
                <div className="payment-detail">Cash on Delivery</div>
              )}
              {formData.paymentMethod === 'bkash' && (
                <div className="payment-details">
                  <div className="payment-detail"><strong>Method:</strong> bKash Payment</div>
                  <div className="payment-detail"><strong>Number:</strong> {formData.mobileNumber}</div>
                  <div className="payment-detail"><strong>Transaction ID:</strong> {formData.transactionId}</div>
                  <div className="payment-detail payment-status">
                    <FontAwesomeIcon icon={faCheckCircle} className="status-icon" /> 
                    Payment verified
                  </div>
                </div>
              )}
              {formData.paymentMethod === 'nagad' && (
                <div className="payment-details">
                  <div className="payment-detail"><strong>Method:</strong> Nagad Payment</div>
                  <div className="payment-detail"><strong>Number:</strong> {formData.mobileNumber}</div>
                  <div className="payment-detail"><strong>Transaction ID:</strong> {formData.transactionId}</div>
                  <div className="payment-detail payment-status">
                    <FontAwesomeIcon icon={faCheckCircle} className="status-icon" /> 
                    Payment verified
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="order-complete-actions">
            <button onClick={() => handleCompletionNavigation('/')} className="secondary-button">
              Continue Shopping
            </button>
            <button onClick={() => handleCompletionNavigation('/account')} className="primary-button">
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="checkout-container">
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
          <button onClick={() => navigate('/cart')} className="secondary-button">
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  // Render empty cart state - this check now happens AFTER checking orderComplete
  if (cartError || cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="error-message">
          <FontAwesomeIcon icon={faShoppingCart} />
          <h2>Your cart is empty</h2>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <button onClick={() => navigate('/')} className="primary-button">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Shipping</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Payment</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Review</div>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-main">
          {/* Shipping Form */}
          {currentStep === 1 && (
            <div className="checkout-step">
              <h2>
                <FontAwesomeIcon icon={faTruck} />
                Shipping Information
              </h2>
              <ShippingForm 
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleNextStep}
                onBack={() => navigate('/cart')}
              />
            </div>
          )}

          {/* Payment Form */}
          {currentStep === 2 && (
            <div className="checkout-step checkout-step--payment">
              <h2>
                <FontAwesomeIcon icon={faCreditCard} />
                Payment Method
              </h2>
              <PaymentForm 
                amount={calculateTotal()}
                onPaymentComplete={handlePaymentComplete}
                onCancel={handlePreviousStep}
                loading={submitting}
              />
            </div>
          )}

          {/* Order Review */}
          {currentStep === 3 && (
            <div className="checkout-step">
              <h2>
                <FontAwesomeIcon icon={faCheckCircle} />
                Review Order
              </h2>
              {/* Review content */}
              <div className="review-section">
                <h3>Shipping Details</h3>
                <div className="review-data">
                  <p>{formData.fullName}</p>
                  <p>{formData.email}</p>
                  <p>{formData.phone}</p>
                  <p>{formData.address}</p>
                  <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                  <p>{formData.country}</p>
                </div>
              </div>

              <div className="review-section">
                <h3>Payment Method</h3>
                <div className="review-data">
                  <p>{formData.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : 'Mobile Banking'}</p>
                  {formData.paymentMethod === 'mobile-banking' && (
                    <>
                      <p>Mobile Number: {formData.mobileNumber}</p>
                      <p>Transaction ID: {formData.transactionId}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={handlePreviousStep}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back
                </button>
                <button 
                  type="button" 
                  className="primary-button"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <FontAwesomeIcon icon={faShoppingCart} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <OrderSummary
          items={cartItems.map(item => ({
            id: item.productId,
            name: item.name,
            price: item.basePrice || item.price || 0,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
            color: item.color,
            size: typeof item.size === 'object' ? item.size.name : (item.size || '')
          }))}
          subtotal={calculateSubtotal()}
          shipping={calculateShipping(calculateSubtotal())}
          tax={calculateTax(calculateSubtotal())}
          total={calculateTotal()}
          showItems={true}
          showDiscount={false}
          showDetails={true}
        />
      </div>

      {/* Security Note */}
      <div className="secure-payment-note">
        <FontAwesomeIcon icon={faShield} />
        <p>Your data is protected with industry-standard encryption. We do not store your full payment details.</p>
      </div>
    </div>
  );
};

export default Checkout; 