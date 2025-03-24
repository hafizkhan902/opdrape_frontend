import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getRelatedProducts } from '../../services/api';
import './RelatedProducts.css';

/**
 * RelatedProducts component displays a list of products related to the current product
 * Uses the API endpoint:
 * - GET `/api/products/related/:productId` - Get related products
 */
const RelatedProducts = ({ productId, currentProductCategory, limit = 4 }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(limit);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!productId) {
        console.log('RelatedProducts: No productId provided, skipping API call');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`RelatedProducts: Fetching related products for product ID: ${productId}`);
        const response = await getRelatedProducts(productId);
        
        // Minimal logging for production
        if (response.data) {
          console.log(`RelatedProducts: Received ${
            Array.isArray(response.data) ? response.data.length : 'object'
          } response`);
          
          // Debug first product to see its structure
          if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('RelatedProducts: Sample product fields:', Object.keys(response.data[0]));
          }
        }
        
        // Handle different API response formats
        let products = [];
        
        if (response.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check if data might be nested in another property
          const possibleArrayFields = Object.entries(response.data)
            .filter(([key, value]) => Array.isArray(value) && value.length > 0)
            .map(([key, value]) => ({ key, length: value.length }));
          
          if (possibleArrayFields.length > 0) {
            // Use the first array field found (e.g., products, data, items, etc.)
            const bestField = possibleArrayFields[0].key;
            console.log(`RelatedProducts: Using nested array from field '${bestField}'`);
            products = response.data[bestField];
          } else {
            console.warn('RelatedProducts: No arrays found in response object');
          }
        }
        
        // Ensure products have required fields including price
        const processedProducts = products.map(product => ({
          ...product,
          // Ensure price exists - check multiple fields or default to a reasonable value
          price: product.price || product.salePrice || product.basePrice || product.discountPrice || 19.99
        }));
        
        setRelatedProducts(processedProducts || []);
      } catch (err) {
        console.error('RelatedProducts: Error fetching related products:', err);
        setError('Failed to load related products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId]);

  const handleViewMore = () => {
    setDisplayCount(prev => prev + limit);
  };

  // Format price with appropriate currency
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  // Get product image based on color variants or default image
  const getProductImage = (product) => {
    // Define a default placeholder image as a data URI
    const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22400%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    if (!product) return DEFAULT_PLACEHOLDER_IMAGE;
    
    // Reduced logging for production
    /*
    console.log('RelatedProducts: Extracting image from product structure:', {
      hasImage: !!product.image,
      hasMainImage: !!product.mainImage,
      hasColorVariants: !!(product.colorVariants && product.colorVariants.length),
      firstColorVariant: product.colorVariants && product.colorVariants.length > 0 
        ? { 
            hasImages: !!(product.colorVariants[0].images && product.colorVariants[0].images.length),
            firstImageType: product.colorVariants[0].images && product.colorVariants[0].images.length > 0
              ? typeof product.colorVariants[0].images[0]
              : null
          }
        : null,
      hasImages: !!(product.images && product.images.length),
      firstImageType: product.images && product.images.length > 0 ? typeof product.images[0] : null
    });
    */
    
    // If it has a direct image URL
    if (product.image) return product.image;
    if (product.mainImage) return product.mainImage;
    if (product.imageUrl) return product.imageUrl;
    if (product.thumbnail) return product.thumbnail;
    
    // If it has colorVariants with images
    if (product.colorVariants && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
      const firstVariant = product.colorVariants[0];
      
      // Handle images as array of objects with url property
      if (firstVariant.images && Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
        // Check if images is array of strings
        if (typeof firstVariant.images[0] === 'string') {
          return firstVariant.images[0];
        }
        
        // Check if images is array of objects with url property
        if (typeof firstVariant.images[0] === 'object') {
          // Check for common image URL properties
          if (firstVariant.images[0].url) return firstVariant.images[0].url;
          if (firstVariant.images[0].src) return firstVariant.images[0].src;
          if (firstVariant.images[0].path) return firstVariant.images[0].path;
        }
      }
    }
    
    // Fallback to images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Check if images is array of strings
      if (typeof product.images[0] === 'string') {
        return product.images[0];
      }
      
      // Check if images is array of objects with url property
      if (typeof product.images[0] === 'object') {
        // Check for common image URL properties
        if (product.images[0].url) return product.images[0].url;
        if (product.images[0].src) return product.images[0].src;
        if (product.images[0].path) return product.images[0].path;
      }
    }
    
    // Return the default placeholder
    return DEFAULT_PLACEHOLDER_IMAGE;
  };

  // Get effective price considering sale price, discounts, etc.
  const getEffectivePrice = (product) => {
    if (!product) return { price: 0.00, onSale: false };
    
    // Debug the actual product data structure to see what price fields exist
    console.log(`RelatedProducts: Product data structure for ${product.name || 'unnamed product'}:`, 
      Object.keys(product).filter(key => 
        key.toLowerCase().includes('price') || 
        key.toLowerCase() === 'cost' || 
        key.toLowerCase() === 'value'
      )
    );
    
    // Case 1: Modern schema with salePrice and regularPrice
    if (product.salePrice !== undefined && product.regularPrice !== undefined) {
      return {
        price: product.salePrice,
        originalPrice: product.regularPrice,
        onSale: parseFloat(product.salePrice) < parseFloat(product.regularPrice)
      };
    }
    
    // Case 2: Schema with basePrice and salePrice (or sale_price)
    if (product.salePrice !== undefined && product.basePrice !== undefined) {
      return {
        price: product.salePrice,
        originalPrice: product.basePrice,
        onSale: parseFloat(product.salePrice) < parseFloat(product.basePrice)
      };
    }

    // Case 3: Schema with discountPrice/discount_price and basePrice
    if ((product.discountPrice !== undefined || product.discount_price !== undefined) && 
        product.basePrice !== undefined) {
      const discount = product.discountPrice !== undefined ? product.discountPrice : product.discount_price;
      return {
        price: discount,
        originalPrice: product.basePrice,
        onSale: parseFloat(discount) < parseFloat(product.basePrice)
      };
    }
    
    // Case 4: Price with discount percentage (common pattern)
    if (product.price !== undefined && product.discount !== undefined) {
      const discountAmount = parseFloat(product.price) * (parseFloat(product.discount) / 100);
      const discountedPrice = parseFloat(product.price) - discountAmount;
      
      return {
        price: discountedPrice,
        originalPrice: product.price,
        onSale: true
      };
    }
    
    // Case 5: Just a single price field
    if (product.price !== undefined) {
      return { 
        price: product.price,
        onSale: false
      };
    }
    
    // Case 6: Try snake_case variants
    if (product.sale_price !== undefined) {
      return { price: product.sale_price, onSale: false };
    }
    
    // Case 7: Fallback to any price-like field we can find
    const possiblePriceFields = [
      'cost', 'value', 'amount', 'retailPrice', 'retail_price', 
      'sellingPrice', 'selling_price', 'listPrice', 'list_price'
    ];
    
    for (const field of possiblePriceFields) {
      if (product[field] !== undefined) {
        return {
          price: product[field],
          onSale: false
        };
      }
    }
    
    // Default fallback - use 0.00 instead of N/A for better display
    return { price: 0.00, onSale: false };
  };

  // Always render the component container even if empty
  return (
    <div className="related-products">
      <h2 className="related-products-title">You May Also Like</h2>
      
      {loading ? (
        <div className="related-products-loading">
          <p>Loading related products...</p>
        </div>
      ) : error ? (
        <div className="related-products-error">
          <p>{error}</p>
        </div>
      ) : relatedProducts.length === 0 ? (
        <div className="related-products-loading">
          <p>No related products available</p>
        </div>
      ) : (
        <>
          <div className="related-products-grid">
            {relatedProducts.slice(0, displayCount).map(product => {
              // Reduced logging for production
              /*
              console.log(`RelatedProducts: Processing product:`, {
                id: product._id,
                name: product.name,
                brand: product.brand,
                imageData: {
                  directImage: product.image,
                  mainImage: product.mainImage,
                  hasColorVariants: !!(product.colorVariants && product.colorVariants.length),
                  hasImages: !!(product.images && product.images.length)
                },
                priceData: {
                  regularPrice: product.regularPrice,
                  salePrice: product.salePrice,
                  basePrice: product.basePrice,
                  discountPrice: product.discountPrice,
                  price: product.price
                }
              });
              */
              
              // Try to extract the image URL
              const imageUrl = getProductImage(product);
              //console.log(`RelatedProducts: Image URL for ${product.name || 'unnamed product'}:`, imageUrl);
              
              // Try to extract price information
              const priceInfo = getEffectivePrice(product);
              //console.log(`RelatedProducts: Price info for ${product.name || 'unnamed product'}:`, priceInfo);
              
              const { price, originalPrice, onSale } = priceInfo;
              
              // Product URL - handle different ID formats
              const productLink = product._id ? `/product/${product._id}` : product.id ? `/product/${product.id}` : '#';
              
              return (
                <Link 
                  to={productLink} 
                  key={product._id || product.id || Math.random()} 
                  className="related-product-card"
                  onClick={(e) => {
                    // If there's no valid product ID, prevent navigation
                    if (productLink === '#') {
                      e.preventDefault();
                      console.warn('RelatedProducts: No valid product ID for navigation', product);
                    }
                  }}
                >
                  {/* Product status indicators */}
                  {product.metadata?.isNewArrival && (
                    <span className="product-status new">New</span>
                  )}
                  {(onSale || product.metadata?.isSale) && !product.metadata?.isNewArrival && (
                    <span className="product-status">Sale</span>
                  )}
                  
                  {/* Product image */}
                  <div className="related-product-image-container">
                    <img 
                      src={imageUrl} 
                      alt={product.name || 'Product'} 
                      onError={(e) => {
                        // Only log in development or for debugging
                        // console.log(`RelatedProducts: Image error for ${product.name || 'unnamed product'}, falling back to placeholder`);
                        e.target.onerror = null; // Prevent further error callbacks
                        // Use a data URI for the placeholder instead of an external URL
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e82d29e1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e82d29e1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22400%22%20fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                      }}
                    />
                  </div>
                  
                  {/* Product information */}
                  <div className="related-product-info">
                    <div className="related-product-brand">{product.brand || 'Brand'}</div>
                    <div className="related-product-name">
                      {product.name || 'Product Name'}
                    </div>
                    <div className="related-product-price">
                      {onSale ? (
                        <>
                          <span className="sale-price">{formatPrice(price)}</span>
                          <span className="regular-price">{formatPrice(originalPrice)}</span>
                          {product.metadata?.salePercentage && (
                            <span className="discount-percent">
                              {product.metadata.salePercentage}% off
                            </span>
                          )}
                        </>
                      ) : (
                        <span>
                          {formatPrice(price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {relatedProducts.length > displayCount && (
            <button className="view-more-button" onClick={handleViewMore}>
              View More
            </button>
          )}
        </>
      )}
    </div>
  );
};

RelatedProducts.propTypes = {
  productId: PropTypes.string.isRequired,
  currentProductCategory: PropTypes.string,
  limit: PropTypes.number
};

export default RelatedProducts; 