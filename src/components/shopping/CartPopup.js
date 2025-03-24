import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faArrowRight, faTimes, faPlus, faMinus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getUserCart, updateCartItem, removeFromCart } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import './CartPopup.css';

/**
 * CartPopup component displays a popup version of the shopping cart
 * triggered from the navbar
 */
const CartPopup = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const popupRef = useRef(null);
  const { updateCart } = useAppContext();
  
  // Fetch cart data when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen]);
  
  // Handle clicking outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Fetch cart items from API
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await getUserCart();
      // Check if the API returns the expected data structure
      if (response.data && Array.isArray(response.data.items)) {
        setCartItems(response.data.items);
        
        // Update global cart state
        updateCart({
          items: response.data.items,
          totalItems: response.data.items.reduce((total, item) => total + item.quantity, 0),
          totalPrice: calculateSubtotal(response.data.items)
        });
      } else if (response.data && response.data.cart && Array.isArray(response.data.cart.items)) {
        // Alternative data structure some APIs might use
        setCartItems(response.data.cart.items);
        
        // Update global cart state
        updateCart({
          items: response.data.cart.items,
          totalItems: response.data.cart.items.reduce((total, item) => total + item.quantity, 0),
          totalPrice: calculateSubtotal(response.data.cart.items)
        });
      } else {
        console.warn('Unexpected cart data format:', response.data);
        setCartItems([]);
        updateCart({ items: [], totalItems: 0, totalPrice: 0 });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Unable to load your shopping cart');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle updating item quantity
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (!productId) {
      console.error('Cannot update item: Missing product ID');
      return;
    }
    
    try {
      await updateCartItem(productId, newQuantity);
      
      // Update local state
      const updatedItems = cartItems.map(item => 
        item.product && item.product._id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      );
      setCartItems(updatedItems);
      
      // Update global cart state
      updateCart({
        items: updatedItems,
        totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: calculateSubtotal(updatedItems)
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };
  
  // Handle removing an item from cart
  const handleRemoveItem = async (productId) => {
    if (!productId) {
      console.error('Cannot remove item: Missing product ID');
      return;
    }
    
    try {
      await removeFromCart(productId);
      
      // Update local state
      const updatedItems = cartItems.filter(item => !item.product || item.product._id !== productId);
      setCartItems(updatedItems);
      
      // Update global cart state
      updateCart({
        items: updatedItems,
        totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
        totalPrice: calculateSubtotal(updatedItems)
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };
  
  // Navigate to checkout and close popup
  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };
  
  // Calculate cart subtotal
  const calculateSubtotal = (items = cartItems) => {
    return items.reduce((total, item) => {
      // Skip items with missing product references
      if (!item || !item.product) {
        return total;
      }
      
      // First try to use the item's own price (which we now always include when adding to cart)
      // This should always be available as we store it when adding to cart
      const price = item.price !== undefined && item.price !== null
        ? item.price
        : (item.product && (
            item.product.salePrice || 
            item.product.basePrice || 
            item.product.price || 0
          ));
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Safe price formatter function
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };
  
  // Get product image with fallbacks
  const getProductImage = (item) => {
    // First check if item or item.product exists
    if (!item || !item.product) return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    // If product has a direct image URL
    if (item.product.image) return item.product.image;
    if (item.product.mainImage) return item.product.mainImage;
    
    // If product has color variants and a selected color
    if (item.product.colorVariants && item.colorName) {
      const selectedVariant = item.product.colorVariants.find(
        variant => variant.color?.name === item.colorName
      );
      
      if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
        if (typeof selectedVariant.images[0] === 'string') {
          return selectedVariant.images[0];
        }
        return selectedVariant.images[0]?.url || '';
      }
    }
    
    // Fallback to first color variant if available
    if (item.product.colorVariants && 
        item.product.colorVariants.length > 0 && 
        item.product.colorVariants[0]?.images && 
        item.product.colorVariants[0].images.length > 0) {
      if (typeof item.product.colorVariants[0].images[0] === 'string') {
        return item.product.colorVariants[0].images[0];
      }
      return item.product.colorVariants[0].images[0]?.url || '';
    }
    
    // Fallback to a default placeholder
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
  };

  if (!isOpen) return null;
  
  return (
    <div className="cart-popup-overlay">
      <div className="cart-popup" ref={popupRef}>
        <div className="cart-popup-header">
          <h3>Your Cart</h3>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {loading ? (
          <div className="cart-popup-loading">
            <div className="loading-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        ) : error ? (
          <div className="cart-popup-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchCartItems}>
              Try Again
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="cart-popup-empty">
            <FontAwesomeIcon icon={faShoppingCart} size="2x" />
            <p>Your cart is empty</p>
            <Link to="/" className="shop-now-btn" onClick={onClose}>
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-popup-items">
              {cartItems.map((item, index) => (
                <div className="cart-popup-item" key={item.product?._id || `item-${index}`}>
                  <div className="cart-popup-item-image">
                    <img 
                      src={getProductImage(item)}
                      alt={item.product?.name || 'Product'} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                      }}
                    />
                  </div>
                  <div className="cart-popup-item-details">
                    {item.product ? (
                      <Link 
                        to={`/product/${item.product._id}`}
                        className="cart-popup-item-name"
                        onClick={onClose}
                      >
                        {item.product.name || 'Unknown Product'}
                      </Link>
                    ) : (
                      <span className="cart-popup-item-name">
                        Product Unavailable
                        <button 
                          className="remove-unavailable-btn"
                          onClick={() => handleRemoveItem(item.productId)}
                          aria-label="Remove unavailable item"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </span>
                    )}
                    
                    {item.colorName && (
                      <div className="cart-popup-item-variant">
                        Color: {item.colorName}
                      </div>
                    )}
                    
                    {item.size && (
                      <div className="cart-popup-item-variant">
                        Size: {typeof item.size === 'object' ? item.size.name : item.size}
                      </div>
                    )}
                    
                    <div className="cart-popup-item-price">
                      {item.originalPrice && item.price && item.originalPrice > item.price ? (
                        <>
                          <span className="current-price">{formatPrice(item.price)}</span>
                          <span className="original-price">{formatPrice(item.originalPrice)}</span>
                        </>
                      ) : (
                        formatPrice(item.price || (item.product && (item.product.salePrice || item.product.basePrice || item.product.price)) || 0)
                      )}
                    </div>
                    
                    <div className="cart-popup-item-actions">
                      {item.product && (
                        <div className="cart-popup-item-quantity">
                          <button 
                            onClick={() => handleUpdateQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                        </div>
                      )}
                      <button 
                        className="cart-popup-item-remove"
                        onClick={() => handleRemoveItem(item.product?._id || item.productId)}
                        aria-label="Remove item"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-popup-footer">
              <div className="cart-popup-subtotal">
                <span>Subtotal:</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>
              
              <div className="cart-popup-actions">
                <Link 
                  to="/cart" 
                  className="view-cart-btn"
                  onClick={onClose}
                >
                  View Cart
                </Link>
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  Checkout <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPopup; 