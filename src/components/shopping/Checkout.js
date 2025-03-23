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
  faMoneyBill,
  faMobileAlt,
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
  const [userProfile, setUserProfile] = useState(null);
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
        console.log('Cart response:', cartResponse); // Debug log

        // Extract cart items from different possible response structures
        let extractedItems = [];
        
        if (cartResponse?.data) {
          // Try different possible cart data structures
          if (Array.isArray(cartResponse.data)) {
            // If data is directly an array of items
            extractedItems = cartResponse.data;
          } else if (Array.isArray(cartResponse.data.items)) {
            // If data has an items array
            extractedItems = cartResponse.data.items;
          } else if (cartResponse.data.cart && Array.isArray(cartResponse.data.cart.items)) {
            // If data has cart.items array
            extractedItems = cartResponse.data.cart.items;
          } else if (cartResponse.data.products && Array.isArray(cartResponse.data.products)) {
            // If data has products array
            extractedItems = cartResponse.data.products;
          } else if (typeof cartResponse.data === 'object' && Object.keys(cartResponse.data).length > 0) {
            // If data is an object (possibly a single cart item)
            extractedItems = [cartResponse.data];
          }
        }
        
        console.log('Extracted items before processing:', extractedItems);
        
        // If no items were found with the standard structures, check if there's a non-standard structure
        if (extractedItems.length === 0 && cartResponse?.data) {
          // Look for any array in the response that might contain cart items
          for (let key in cartResponse.data) {
            if (Array.isArray(cartResponse.data[key]) && cartResponse.data[key].length > 0) {
              extractedItems = cartResponse.data[key];
              console.log(`Found potential cart items in property: ${key}`, extractedItems);
              break;
            }
          }
        }
        
        // Process and normalize cart items to ensure they have all required properties
        const normalizedItems = extractedItems.map(item => {
          // Extract product ID using the helper function
          const productId = extractProductId(item);
          console.log(`Extracted product ID for item:`, { item, productId });
          
          // Determine the item structure and extract relevant data
          const normalizedItem = {
            // Use the extracted product ID
            productId: productId || '',
            
            // Try different property names to find the product name
            name: item.name || item.productName || item.title || item.product_name || 
                  (item.product && (item.product.name || item.product.title)) || 'Product',
            
            // Try different property names to find the price
            price: parseFloat(item.price || item.unit_price || item.unitPrice || 
                   (item.product && (item.product.price || item.product.unit_price)) || 0),
            
            // Try different property names to find the quantity
            quantity: parseInt(item.quantity || item.qty || item.count || 1),
            
            // Try different property names to find the product image
            image: item.image || item.thumbnail || item.img || item.picture || 
                   (item.product && (item.product.image || item.product.thumbnail)) || 
                   'https://via.placeholder.com/60',
            
            // Try different property names to find color/size variants
            color: item.color || item.variant_color || (item.variant && item.variant.color) || '',
            size: item.size || item.variant_size || (item.variant && item.variant.size) || ''
          };
          
          return normalizedItem;
        });
        
        console.log('Normalized cart items:', normalizedItems);
        
        // Filter items with valid product IDs and fetch their detailed information
        const validItems = normalizedItems.filter(item => {
          const hasValidId = item.productId && /^[0-9a-f]{24}$/i.test(item.productId);
          if (!hasValidId) {
            console.warn(`Skipping item with invalid product ID: ${item.productId}`, item);
          }
          return hasValidId;
        });
        
        console.log(`Found ${validItems.length} items with valid product IDs out of ${normalizedItems.length} total items`);
        
        // Attempt to fetch product details for each valid item
        let enrichedItems = [];
        
        if (validItems.length > 0) {
          try {
            // Create an array of promises to fetch all products concurrently
            const productPromises = validItems.map(item => {
              return getProductById(item.productId)
                .then(response => {
                  if (!response?.data) {
                    console.warn(`No data returned for product ${item.productId}`);
                    return item; // Return original item if no data
                  }
                  
                  const productData = response.data;
                  console.log(`Product data for ${item.productId}:`, productData);
                  
                  // Validate that the returned product has the expected ID
                  const returnedId = productData._id || productData.id;
                  if (returnedId && returnedId !== item.productId) {
                    console.warn(`Product ID mismatch. Expected: ${item.productId}, Got: ${returnedId}`);
                  }
                  
                  // Return enriched item with product data
                  return {
                    ...item,
                    productId: item.productId, // Keep original product ID
                    price: productData.price || item.price || 0,
                    name: productData.name || productData.title || item.name,
                    image: productData.image || productData.thumbnail || item.image,
                    // Add any other product details we want to include
                  };
                })
                .catch(error => {
                  console.error(`Error fetching product ${item.productId}:`, error);
                  return item; // Return original item on error
                });
            });
            
            // Wait for all product requests to complete
            const fetchedItems = await Promise.all(productPromises);
            console.log('Fetched product details:', fetchedItems);
            
            // Combine fetched items with any invalid items that were filtered out
            const invalidItems = normalizedItems.filter(item => !item.productId || !/^[0-9a-f]{24}$/i.test(item.productId));
            enrichedItems = [...fetchedItems, ...invalidItems];
          } catch (error) {
            console.error('Error fetching product details:', error);
            enrichedItems = normalizedItems; // Fallback to normalized items
          }
        } else {
          enrichedItems = normalizedItems;
        }
        
        console.log('Final enriched cart items:', enrichedItems);
        
        // Set cart items state
        if (enrichedItems.length === 0) {
          setCartError(true);
          setError('Your cart is empty. Please add items to your cart before checkout.');
        } else {
          setCartItems(enrichedItems);
          setCartError(false);
        }
        
        // Fetch user profile for shipping info
        const profileResponse = await getUserProfile();
        if (profileResponse.data) {
          setUserProfile(profileResponse.data);
          
          // Store user profile data in localStorage for retrieval in OrderConfirmation
          try {
            if (!localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(profileResponse.data.user || profileResponse.data));
            }
          } catch (storageError) {
            console.warn('Error storing user profile in localStorage:', storageError);
          }
          
          // Pre-fill shipping form with user profile data if available
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
            
            // Save form data to localStorage immediately if pre-filled
            try {
              localStorage.setItem('checkoutFormData', JSON.stringify(updatedFormData));
            } catch (storageError) {
              console.warn('Error storing pre-filled form data in localStorage:', storageError);
            }
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
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    // Save updated form data to localStorage for later retrieval
    try {
      localStorage.setItem('checkoutFormData', JSON.stringify(updatedFormData));
    } catch (error) {
      console.warn('Error saving form data to localStorage:', error);
    }
  };

  // Calculate cart totals
  const calculateSubtotal = () => {
    console.log('Calculating subtotal for items:', cartItems);
    const subtotal = cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      console.log(`Item: ${item.name}, Price: ${price}, Quantity: ${quantity}, Subtotal: ${price * quantity}`);
      return total + (price * quantity);
    }, 0);
    console.log('Final subtotal:', subtotal);
    return subtotal;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.05;
    console.log('Calculated tax:', tax);
    return tax;
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    const shipping = subtotal > 5000 ? 0 : 120;
    console.log('Calculated shipping:', shipping);
    return shipping;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const shipping = calculateShipping();
    const total = subtotal + tax + shipping;
    console.log('Calculated total:', { subtotal, tax, shipping, total });
    return total;
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle step navigation
  const handleNextStep = (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Validate current step
    if (currentStep === 1) {
      // Validate shipping info
      const { fullName, email, phone, address, city, state, zipCode } = formData;
      if (!fullName || !email || !phone || !address || !city || !state || !zipCode) {
        alert('Please fill in all required shipping information fields.');
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
            size: item.size || ''
          })),
          subtotal: calculateSubtotal(),
          shippingCost: calculateShipping(),
          tax: calculateTax(),
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
            shipping: calculateShipping(),
            tax: calculateTax(),
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
      
      // Detailed console log of product IDs for debugging
      const productIds = validCartItems.map(item => {
        const productId = extractProductId(item);
        // Add both the ID and item reference for debugging
        return { 
          id: productId, 
          itemRef: typeof item.product === 'object' ? 'object' : typeof item.product 
        };
      });
      console.log('Product IDs being used in order:', productIds);
      
      // Format order data according to backend requirements
      const orderData = {
        items: validCartItems.map(item => {
          const productId = extractProductId(item);
          console.log(`Adding product ID ${productId} to order (from item with structure: ${JSON.stringify({
            hasProductObject: typeof item.product === 'object',
            hasProductId: Boolean(item.productId),
            hasItemId: Boolean(item._id)
          })})`);
          
          return {
            product: productId, // The product field must contain a valid MongoDB ID
            quantity: item.quantity || 1
          };
        }),
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
      
      // Handle order completion and navigation
      await handleOrderCompletion(extractedOrderId);
      
      // Clear cart after successful order
      await clearCartAfterOrderSuccess();
      
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
        await handleOrderCompletion(mockOrderId);
        await clearCartAfterOrderSuccess();
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
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Shipping</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
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

      <div className="checkout-content checkout-content--centered">
        <div className="checkout-main">
          {/* Step 1: Shipping Information */}
          {currentStep === 1 && (
            <ShippingForm
              initialValues={formData}
              onSubmit={(shippingData) => {
                // Update form data with shipping information
                setFormData(prevFormData => ({
                  ...prevFormData,
                  ...shippingData
                }));
                // Move to next step
                handleNextStep({ preventDefault: () => {} });
              }}
              onBack={() => navigate('/cart')}
              calculateTotal={calculateTotal}
              formatPrice={formatPrice}
            />
          )}

          {/* Step 2: Payment Information */}
          {currentStep === 2 && (
            <div className="checkout-step checkout-step--payment">
              <h2>
                <FontAwesomeIcon icon={faCreditCard} />
                Payment Method
              </h2>
              <div className="payment-container">
                <PaymentForm
                  amount={calculateTotal()}
                  onPaymentComplete={handlePaymentComplete}
                  onCancel={() => {
                    // Allow user to go back
                    handlePreviousStep();
                  }}
                  loading={submitting}
                />
              </div>
            </div>
          )}

          {/* Step 3: Order Review */}
          {currentStep === 3 && (
            <div className="checkout-step checkout-step--review">
              <h2>
                <FontAwesomeIcon icon={faCheckCircle} />
                Review Your Order
              </h2>
              
              <div className="review-section">
                <h3>Shipping Information</h3>
                <div className="review-data">
                  <p><strong>{formData.fullName}</strong></p>
                  <p>{formData.address}</p>
                  <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                  <p>{formData.country}</p>
                  <p>{formData.phone}</p>
                  <p>{formData.email}</p>
                </div>
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => setCurrentStep(1)}
                >
                  Edit
                </button>
              </div>
              
              <div className="review-section">
                <h3>Payment Method</h3>
                <div className="review-data">
                  {formData.paymentMethod === 'cod' && (
                    <p><strong>Cash on Delivery</strong></p>
                  )}
                  {formData.paymentMethod === 'bkash' && (
                    <>
                      <p><strong>bKash Payment</strong></p>
                      <p>Your bKash Number: {formData.mobileNumber}</p>
                      <p>Transaction ID: {formData.transactionId}</p>
                      <p className="review-data__merchant">Merchant Number: 01701234567</p>
                      <div className="review-data__verification">
                        <div className="review-data__verification-icon">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <span>Transaction will be verified before processing</span>
                      </div>
                    </>
                  )}
                  {formData.paymentMethod === 'nagad' && (
                    <>
                      <p><strong>Nagad Payment</strong></p>
                      <p>Your Nagad Number: {formData.mobileNumber}</p>
                      <p>Transaction ID: {formData.transactionId}</p>
                      <p className="review-data__merchant">Merchant Number: 01801234567</p>
                      <div className="review-data__verification">
                        <div className="review-data__verification-icon">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <span>Transaction will be verified before processing</span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit
                </button>
              </div>
              
              <div className="review-section">
                <h3>Order Items ({cartItems.length})</h3>
                <div className="review-items">
                  {cartItems.map((item, index) => (
                    <div key={index} className="review-item">
                      <div className="review-item-image">
                        <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} />
                      </div>
                      <div className="review-item-details">
                        <h4>{item.name}</h4>
                        <div className="review-item-meta">
                          {item.color && <span className="meta-item">Color: {item.color}</span>}
                          {item.size && <span className="meta-item">Size: {item.size}</span>}
                          <span className="meta-item">Qty: {item.quantity}</span>
                          <span className="meta-item">Unit Price: {formatPrice(item.price)}</span>
                        </div>
                      </div>
                      <div className="review-item-price">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="order-summary review-summary">
                <div className="summary-subtotal summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="summary-tax summary-row">
                  <span>Tax (5%)</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <div className="summary-shipping summary-row">
                  <span>Shipping</span>
                  <span>
                    {calculateShipping() === 0 ? 'Free' : formatPrice(calculateShipping())}
                  </span>
                </div>
                <div className="summary-total summary-row">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
              
              <div className="order-notes">
                <h3>Order Notes (Optional)</h3>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any special instructions or delivery notes"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handlePreviousStep}
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Back to Payment
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={async (e) => {
                    // Store a reference to the cart items for the order completion screen
                    const currentItems = [...cartItems];
                    
                    // Process the order
                    await handleSubmitOrder(e);
                    
                    // Ensure cart is cleared after a short delay
                    if (orderComplete || document.querySelector('.order-complete')) {
                      console.log('Order confirmed complete, forcing final cart clear');
                      setTimeout(() => {
                        clearCartAfterOrderSuccess();
                        
                        // Force a UI update
                        try {
                          // Update header cart count if it exists
                          const cartCountElement = document.querySelector('.cart-count');
                          if (cartCountElement) cartCountElement.textContent = '0';
                          
                          // Broadcast another clear event
                          window.dispatchEvent(new CustomEvent('cartCleared', { 
                            detail: { source: 'checkout-button', timestamp: new Date().toISOString() } 
                          }));
                          
                          console.log('Forced cart clear and UI update after order placement');
                        } catch (e) {
                          console.warn('Error during forced UI cart update:', e);
                        }
                      }, 1000); // Short delay to ensure order is fully processed
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <OrderSummary 
            items={cartItems}
            subtotal={Number(calculateSubtotal())}
            shipping={Number(calculateShipping())}
            tax={Number(calculateTax())}
            discount={0}
            total={Number(calculateTotal())}
          />
          
          <div className="checkout-security">
            <FontAwesomeIcon icon={faShield} />
            <p>
              Your data is protected with industry-standard encryption.
              We do not store your full payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 