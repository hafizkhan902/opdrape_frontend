import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faStar, faStarHalfAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { addToCart, addToWishlist, removeFromWishlist } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import './ProductCard.css';

// Helper function to get product image - add this before the component declaration
const getProductImageFromData = (product) => {
  // First try to get image directly from product.image if it exists
  if (product.image) {
    return product.image;
  }
  
  // If no direct image, try to get from colorVariants structure
  if (product.colorVariants && 
      product.colorVariants.length > 0 && 
      product.colorVariants[0].images && 
      product.colorVariants[0].images.length > 0) {
    // Try different possible image url formats
    return product.colorVariants[0].images[0].url || 
           product.colorVariants[0].images[0].src || 
           product.colorVariants[0].images[0];
  }
  
  // Fallback to placeholder
  return null;
};

const ProductCard = ({ product, inWishlist = false }) => {
  const { isAuthenticated, updateCart } = useAppContext();
  const [loading, setLoading] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(inWishlist);
  const [wishlistLoading, setWishlistLoading] = React.useState(false);

  // Check for missing product ID and log a warning
  useEffect(() => {
    if (product && !product.id && !product._id && !product.slug) {
      console.warn('Product is missing ID, MongoDB _id and slug:', product);
    }
  }, [product]);

  // Check if product is undefined and provide a fallback
  if (!product) {
    console.error('ProductCard: Received undefined product');
    return null; // Don't render anything if product is undefined
  }

  // Update the extracted properties to include image from colorVariants
  const {
    id,
    _id, // MongoDB ID from backend
    name = 'Unnamed Product',
    price,
    basePrice,
    image, // We'll still extract this but will use our helper function for display
    rating = 0,
    discount = 0,
    brandName,
    slug,
    isNew = false,
    outOfStock = false
  } = product;

  // Get image from nested structure if available
  const productImage = getProductImageFromData(product);

  // Use MongoDB _id first, then fall back to other identifiers
  const productUrlId = _id || slug || id || (`product-${Date.now()}`);

  // SIMPLIFIED: Pre-format price values with defaults to avoid any toFixed calls in JSX
  const formattedOriginalPrice = formatPrice(price || basePrice);
  const formattedDiscountPrice = (discount > 0) ? 
    formatPrice((1 - discount/100) * (parseFloat(price) || parseFloat(basePrice) || 0)) : 
    null;

  // Format price safely WITHOUT using toFixed
  function formatPrice(value) {
    try {
      // If value is undefined or null, return "0.00"
      if (value === undefined || value === null) return "0.00";
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return "0.00";
      
      // Format to 2 decimal places manually as a string instead of using toFixed
      return (Math.round(numValue * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (err) {
      console.error('Error formatting price:', err, 'Value:', value);
      return "0.00";
    }
  }

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={`star-${i}`} icon={faStar} />);
    }
    
    if (hasHalfStar) {
      stars.push(<FontAwesomeIcon key="half-star" icon={faStarHalfAlt} />);
    }
    
    return stars;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      return;
    }

    setLoading(true);
    try {
      const response = await addToCart({
        productId: _id || id, // Use MongoDB ID first
        quantity: 1,
      });
      
      // Update cart in context
      updateCart(response.data);
      
      // Show success message (could use a toast notification here)
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(_id || id); // Use MongoDB ID first
        setIsInWishlist(false);
      } else {
        await addToWishlist(_id || id); // Use MongoDB ID first
        setIsInWishlist(true);
      }
      // Show success message
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Show error message
    } finally {
      setWishlistLoading(false);
    }
  };

  // Determine which tag to show
  const getProductTag = () => {
    if (outOfStock) {
      return <span className="product-tag out-of-stock">Out of Stock</span>;
    } else if (discount > 0) {
      return <span className="product-tag sale">-{discount}%</span>;
    } else if (isNew) {
      return <span className="product-tag new">New</span>;
    }
    return null;
  };

  return (
    <div className="product-card">
      <div className="product-card-image">
        <Link to={`/product/${productUrlId}`}>
          <img 
            src={productImage || 'https://via.placeholder.com/300x300'} 
            alt={name || 'Product'} 
            loading="lazy"
            onError={(e) => {
              console.log('Image failed to load for product:', name);
              e.target.src = 'https://via.placeholder.com/300x300';
            }}
          />
        </Link>
        
        {getProductTag()}
        
        <button 
          className={`wishlist-button ${isInWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FontAwesomeIcon icon={isInWishlist ? faHeart : farHeart} />
        </button>

        <Link to={`/product/${productUrlId}`} className="quick-view-overlay">
          <FontAwesomeIcon icon={faEye} /> Quick View
        </Link>
      </div>
      
      <div className="product-card-content">
        {brandName && (
          <span className="product-brand">{brandName}</span>
        )}
        
        <h3 className="product-title">
          {name}
        </h3>
        
        <div className="product-rating">
          {renderStars(rating)}
          <span className="rating-count">({rating})</span>
        </div>
        
        <div className="product-price">
          {discount > 0 ? (
            <>
              <span className="current-price">৳{formattedDiscountPrice}</span>
              <span className="original-price">৳{formattedOriginalPrice}</span>
            </>
          ) : (
            <span className="current-price">৳{formattedOriginalPrice}</span>
          )}
        </div>
      </div>

      <div className="product-card-footer">
        <button 
          className="add-to-cart-button"
          onClick={handleAddToCart}
          disabled={loading || outOfStock}
        >
          <FontAwesomeIcon icon={faShoppingCart} />
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.string,
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    basePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    image: PropTypes.string,
    rating: PropTypes.number,
    discount: PropTypes.number,
    brandName: PropTypes.string,
    slug: PropTypes.string,
    isNew: PropTypes.bool,
    outOfStock: PropTypes.bool
  }),
  inWishlist: PropTypes.bool
};

export default ProductCard; 