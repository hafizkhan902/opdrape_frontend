import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { updateCartItem, removeFromCart } from '../../services/api';
import './ShoppingCart.css';

/**
 * CartItem component displays a single item in the shopping cart
 * and provides controls for changing quantity or removing the item
 */
const CartItem = ({ 
  item, 
  onUpdateCart, 
  onRemoveFromCart 
}) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Get product image based on color variants or default image
  const getProductImage = () => {
    // First check if item or item.product exists
    if (!item || !item.product) {
      return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    }
    
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

  // Safe price formatter function
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  // Get the single item price (unit price)
  const getItemPrice = () => {
    // If item has its own price, use that first
    if (item.price !== undefined && item.price !== null) {
      return item.price;
    }
    
    // Otherwise use the product price
    if (item.product) {
      if (item.product.salePrice) return item.product.salePrice;
      if (item.product.basePrice) return item.product.basePrice;
      if (item.product.price) return item.product.price;
    }
    
    return 0;
  };

  // Calculate the total price for this item (price × quantity)
  const getItemTotalPrice = () => {
    const price = getItemPrice();
    return price * quantity;
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  // Update quantity in cart
  const handleUpdateQuantity = async () => {
    if (quantity === item.quantity) return;
    
    setIsUpdating(true);
    try {
      const response = await updateCartItem(item.product._id, quantity);
      onUpdateCart(response.data);
    } catch (error) {
      console.error('Error updating cart item:', error);
      // Revert to original quantity on error
      setQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle increment/decrement buttons
  const handleIncrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Handle quantity input blur (update when user finishes typing)
  const handleQuantityBlur = () => {
    handleUpdateQuantity();
  };

  // Remove item from cart
  const handleRemoveItem = async () => {
    setIsRemoving(true);
    try {
      await removeFromCart(item.product._id);
      onRemoveFromCart(item.product._id);
    } catch (error) {
      console.error('Error removing item from cart:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // If product data is missing
  if (!item.product) {
    return (
      <div className="cart-item">
        <div className="cart-item-details">
          <div className="cart-item-header">
            <h3 className="cart-item-name">Unknown Product</h3>
          </div>
          <div className="cart-item-actions">
            <button 
              className="remove-item-btn" 
              onClick={handleRemoveItem}
              disabled={isRemoving}
            >
              <FontAwesomeIcon icon={faTrash} />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-item">
      <img 
        src={getProductImage()} 
        alt={item.product.name} 
        className="cart-item-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
        }}
      />
      <div className="cart-item-details">
        <div className="cart-item-header">
          <h3 className="cart-item-name">{item.product.name}</h3>
          <div className="cart-item-price">
            {item.originalPrice && item.price && item.originalPrice > item.price ? (
              <>
                <span className="current-price">{formatPrice(item.price)}</span>
                <span className="original-price">{formatPrice(item.originalPrice)}</span>
              </>
            ) : (
              formatPrice(getItemPrice())
            )}
          </div>
        </div>
        
        <div className="cart-item-meta">
          {item.colorName && (
            <div className="cart-item-meta-item">
              <span className="cart-item-meta-item-label">Color:</span>
              <span>{item.colorName}</span>
            </div>
          )}
          {item.size && (
            <div className="cart-item-variant">
              <span>Size:</span>
              <span>{typeof item.size === 'object' ? item.size.name : item.size}</span>
            </div>
          )}
          {item.product.brand && (
            <div className="cart-item-meta-item">
              <span className="cart-item-meta-item-label">Brand:</span>
              <span>{item.product.brand}</span>
            </div>
          )}
        </div>
        
        <div className="cart-item-actions">
          <div className="cart-item-quantity">
            <button 
              className="quantity-btn" 
              onClick={handleDecrementQuantity}
              disabled={quantity <= 1 || isUpdating}
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <input
              type="number"
              className="quantity-input"
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              min="1"
              disabled={isUpdating}
            />
            <button 
              className="quantity-btn" 
              onClick={handleIncrementQuantity}
              disabled={isUpdating}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          
          <button 
            className="remove-item-btn" 
            onClick={handleRemoveItem}
            disabled={isRemoving}
          >
            <FontAwesomeIcon icon={faTrash} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

CartItem.propTypes = {
  item: PropTypes.shape({
    product: PropTypes.object,
    quantity: PropTypes.number.isRequired,
    colorName: PropTypes.string,
    size: PropTypes.string,
    price: PropTypes.number
  }).isRequired,
  onUpdateCart: PropTypes.func.isRequired,
  onRemoveFromCart: PropTypes.func.isRequired
};

export default CartItem; 