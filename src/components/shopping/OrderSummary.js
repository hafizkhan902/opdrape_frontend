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
    console.log('Formatting price:', price);
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice || 0);
  };

  console.log('OrderSummary props:', { items, subtotal, shipping, tax, discount, total });

  return (
    <div className={`order-summary ${className}`}>
      <h3 className="summary-title">Order Summary</h3>
      
      {/* Display cart items if showItems is true */}
      {showItems && items && items.length > 0 && (
        <div className="summary-items">
          {items.map((item, index) => {
            const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
            console.log(`Item ${index + 1}:`, { 
              name: item.name, 
              price: item.price, 
              quantity: item.quantity, 
              total: itemTotal 
            });
            return (
              <div key={item.id || index} className="summary-item-row">
                <div className="item-info">
                  <span className="item-quantity">{item.quantity}x</span>
                  <span className="item-name">
                    {item.name || item.productName}
                    {(item.color || item.size) && (
                      <span className="item-variant">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && ', '}
                        {item.size && <span>Size: {item.size}</span>}
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
  items: PropTypes.array,
  subtotal: PropTypes.number.isRequired,
  shipping: PropTypes.number.isRequired,
  tax: PropTypes.number.isRequired,
  discount: PropTypes.number,
  total: PropTypes.number.isRequired,
  showItems: PropTypes.bool,
  showDiscount: PropTypes.bool,
  showDetails: PropTypes.bool,
  className: PropTypes.string
};

OrderSummary.defaultProps = {
  items: [],
  discount: 0,
  showItems: true,
  showDiscount: true,
  showDetails: true,
  className: ''
};
export default OrderSummary; 