import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTag, 
  faTruck, 
  faPercent, 
  faMoneyBill, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import './OrderSummary.css';

/**
 * OrderSummary component displays a summary of cart items and totals
 * Used in shopping cart, checkout, and order confirmation pages
 */
const OrderSummary = ({ 
  items, 
  subtotal, 
  shipping, 
  tax, 
  discount, 
  total, 
  showItems = true, 
  showDiscount = true, 
  showDetails = true,
  className = ''
}) => {
  
  // Format price to display with proper currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '৳0';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice < 0) return '৳0';
    return `৳${Math.round(numericPrice).toLocaleString('en-BD')}`;
  };

  return (
    <div className={`order-summary ${className}`}>
      <h3 className="summary-title">Order Summary</h3>
      
      {/* Display cart items if showItems is true */}
      {showItems && items && items.length > 0 && (
        <div className="summary-items">
          {items.map((item, index) => {
            // First try to get basePrice, then fall back to regular price
            const rawPrice = item.basePrice || item.price;
            const itemPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;
            const validPrice = isNaN(itemPrice) ? 0 : itemPrice;
            
            const itemQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            const validQuantity = isNaN(itemQuantity) ? 0 : itemQuantity;
            
            const itemTotal = validPrice * validQuantity;
            
            return (
              <div key={item.id || item.productId || index} className="summary-item-row">
                <div className="item-info">
                  <span className="item-quantity">{validQuantity}×</span>
                  <span className="item-name">
                    {item.name}
                    {(item.color || item.size) && (
                      <span className="item-variant">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && ' • '}
                        {item.size && <span>Size: {typeof item.size === 'object' ? item.size.name : item.size}</span>}
                      </span>
                    )}
                  </span>
                </div>
                <span className="item-price">{formatPrice(itemTotal)}</span>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="summary-totals">
        <div className="summary-row">
          <span>
            <FontAwesomeIcon icon={faTag} className="summary-icon" />
            Subtotal
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        {showDiscount && discount > 0 && (
          <div className="summary-row discount">
            <span>
              <FontAwesomeIcon icon={faPercent} className="summary-icon" />
              Discount
            </span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        
        <div className="summary-row">
          <span>
            <FontAwesomeIcon icon={faTruck} className="summary-icon" />
            Shipping
          </span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        
        <div className="summary-row">
          <span>
            <FontAwesomeIcon icon={faPercent} className="summary-icon" />
            Tax
          </span>
          <span>{formatPrice(tax)}</span>
        </div>
        
        <div className="summary-row total">
          <span>
            <FontAwesomeIcon icon={faMoneyBill} className="summary-icon" />
            Total
          </span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      
      {showDetails && (
        <div className="summary-note">
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>Shipping costs calculated at checkout</span>
        </div>
      )}
    </div>
  );
};

OrderSummary.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    productId: PropTypes.string,
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    basePrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    color: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  })),
  subtotal: PropTypes.number,
  shipping: PropTypes.number,
  tax: PropTypes.number,
  discount: PropTypes.number,
  total: PropTypes.number,
  showItems: PropTypes.bool,
  showDiscount: PropTypes.bool,
  showDetails: PropTypes.bool,
  className: PropTypes.string
};

OrderSummary.defaultProps = {
  items: [],
  subtotal: 0,
  shipping: 0,
  tax: 0,
  discount: 0,
  total: 0,
  showItems: true,
  showDiscount: true,
  showDetails: true,
  className: ''
};

export default OrderSummary; 