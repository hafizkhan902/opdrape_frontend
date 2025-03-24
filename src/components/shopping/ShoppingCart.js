import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faArrowLeft, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import CartItem from './CartItem';
import { getUserCart, clearCart } from '../../services/api';
import './ShoppingCart.css';

/**
 * ShoppingCart component displays the user's shopping cart
 * showing all added items, quantities, and prices with
 * controls to update quantities or remove items
 */
const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Fetch cart data on component mount
  useEffect(() => {
    fetchCartItems();
  }, []);
  
  // Fetch cart items from API
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await getUserCart();
      // Check if the API returns the expected data structure
      if (response.data && Array.isArray(response.data.items)) {
        setCartItems(response.data.items);
      } else if (response.data && response.data.cart && Array.isArray(response.data.cart.items)) {
        // Alternative data structure some APIs might use
        setCartItems(response.data.cart.items);
      } else {
        console.warn('Unexpected cart data format:', response.data);
        setCartItems([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Unable to load your shopping cart. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cart item updates
  const handleUpdateCart = (updatedCart) => {
    if (updatedCart && Array.isArray(updatedCart.items)) {
      setCartItems(updatedCart.items);
    } else if (updatedCart && updatedCart.cart && Array.isArray(updatedCart.cart.items)) {
      setCartItems(updatedCart.cart.items);
    } else {
      // If the response structure is different, refresh the entire cart
      fetchCartItems();
    }
  };
  
  // Handle removing an item from cart
  const handleRemoveFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(
      item => !item.product || item.product._id !== productId
    ));
  };
  
  // Handle clearing all items from cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
        setCartItems([]);
      } catch (error) {
        console.error('Error clearing cart:', error);
        setError('Failed to clear your cart. Please try again.');
      }
    }
  };
  
  // Calculate cart subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      // Check if item has a product reference
      if (!item || !item.product) {
        return total;
      }
      
      const price = item.price || 
        (item.product && (
          item.product.salePrice || 
          item.product.basePrice || 
          item.product.price || 0
        ));
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Calculate estimated tax (for display purposes)
  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.07; // 7% tax rate example
  };
  
  // Calculate shipping (example logic)
  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    // Free shipping over ৳50, otherwise ৳5.99
    return subtotal > 50 ? 0 : 5.99;
  };
  
  // Calculate total order amount
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };
  
  // Safe price formatter function
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };
  
  // Navigate to checkout
  const handleCheckout = () => {
    navigate('/checkout');
  };
  
  // Continue shopping - go back
  const handleContinueShopping = () => {
    navigate(-1);
  };
  
  // Filter out any cart items with missing products before rendering
  const validCartItems = cartItems.filter(item => item && item.product);
  
  // Handle item with missing product by keeping their IDs for removal
  const invalidCartItems = cartItems.filter(item => item && !item.product).map(item => item.productId);
  
  // If there are invalid items, log and provide removal option
  useEffect(() => {
    if (invalidCartItems.length > 0) {
      console.warn(`Found ${invalidCartItems.length} cart items with missing products:`, invalidCartItems);
      // You could automatically remove these invalid items:
      // invalidCartItems.forEach(productId => {
      //   if (productId) removeFromCart(productId).catch(err => console.error(err));
      // });
    }
  }, [cartItems]);
  
  // Handle empty cart state, including case where all products are invalid
  if (!loading && (cartItems.length === 0 || validCartItems.length === 0)) {
    return (
      <div className="shopping-cart-container">
        <div className="shopping-cart empty-cart">
          <div className="cart-header">
            <h2>Your Shopping Cart</h2>
          </div>
          <div className="empty-cart-message">
            <FontAwesomeIcon icon={faShoppingCart} size="3x" />
            <p>Your cart is empty</p>
            <Link to="/" className="primary-button">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="shopping-cart-container">
      <div className="shopping-cart">
        <div className="cart-header">
          <h2>Your Shopping Cart</h2>
          {cartItems.length > 0 && (
            <button 
              className="clear-cart-button" 
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button 
              className="primary-button" 
              onClick={fetchCartItems}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {validCartItems.map((item, index) => (
                <CartItem
                  key={`${item.product._id || index}`}
                  item={item}
                  onUpdateCart={handleUpdateCart}
                  onRemoveFromCart={handleRemoveFromCart}
                />
              ))}
            </div>
            
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>
              <div className="summary-row">
                <span>Estimated Tax:</span>
                <span>{formatPrice(calculateTax())}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>
                  {calculateShipping() === 0 
                    ? 'Free' 
                    : formatPrice(calculateShipping())}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
              
              <div className="cart-actions">
                <button 
                  className="secondary-button" 
                  onClick={handleContinueShopping}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Continue Shopping
                </button>
                <button 
                  className="primary-button checkout-button" 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart; 