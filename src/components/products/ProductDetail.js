import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faShoppingCart, 
  faShare, 
  faTag,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { 
  getProductById, 
  addToWishlist, 
  removeFromWishlist, 
  addToCart,
  getWishlist
} from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import ProductImages from './ProductImages';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, updateCart, updateWishlist } = useAppContext();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      
      console.log("ProductDetail: Fetching product with ID:", productId);
      
      if (!productId) {
        setError('Product ID is missing. Please return to the product list.');
        setLoading(false);
        return;
      }
      
      // Check if this is a MongoDB ID (24-character hex string)
      const isMongoDB_ID = productId && /^[0-9a-f]{24}$/i.test(productId);
      const isFallbackId = productId && productId.startsWith('product-');
      
      console.log("ProductDetail: Is MongoDB ID?", isMongoDB_ID);
      console.log("ProductDetail: Is fallback ID?", isFallbackId);
      
      try {
        let productData = null;
        
        if (!isFallbackId) {
          // Regular API call for any real product ID (including MongoDB _id)
          console.log("ProductDetail: Calling API with productId:", productId);
          try {
            const response = await getProductById(productId);
            console.log("ProductDetail: API Response:", response.data);
            
            if (!response.data) {
              console.error("Empty response data");
              throw new Error("Empty response data");
            }
            
            productData = response.data;
          } catch (apiError) {
            console.error("API error:", apiError);
            
            // For MongoDB IDs that fail, show an error
            if (isMongoDB_ID) {
              setError('Product data could not be loaded from the server.');
              setLoading(false);
              return;
            }
            
            // For non-MongoDB IDs that fail, fall back to demo product
            console.log("API call failed, using fallback product data");
            productData = null;
          }
        }
        
        if (isFallbackId || !productData) {
          // For fallback IDs, create a mock product to display
          console.warn('Using fallback product data for ID:', productId);
          
          // Mock data matching the new data structure
          productData = {
            name: "Classic Cotton T-Shirt",
            description: "Premium cotton t-shirt with comfortable fit",
            category: "men",
            subCategory: "t-shirts",
            brand: "OpDrape",
            basePrice: 29.99,
            salePrice: 24.99,
            colorVariants: [
              {
                color: {
                  name: "Navy Blue",
                  hexCode: "#000080"
                },
                images: [
                  {
                    url: "https://via.placeholder.com/600x800/000080/ffffff?text=Navy+Blue+T-Shirt",
                    alt: "Navy Blue T-Shirt"
                  }
                ],
                sizes: [
                  {
                    name: "M",
                    quantity: 50
                  },
                  {
                    name: "L",
                    quantity: 30
                  }
                ]
              },
              {
                color: {
                  name: "Black",
                  hexCode: "#000000"
                },
                images: [
                  {
                    url: "https://via.placeholder.com/600x800/000000/ffffff?text=Black+T-Shirt",
                    alt: "Black T-Shirt"
                  }
                ],
                sizes: [
                  {
                    name: "S",
                    quantity: 20
                  },
                  {
                    name: "M",
                    quantity: 40
                  }
                ]
              }
            ],
            material: "Cotton",
            features: ["100% Cotton", "Machine Washable"],
            careInstructions: ["Machine wash cold", "Tumble dry low"],
            tags: ["casual", "basics", "men"],
            displayPage: "new-arrivals",
            metadata: {
              isNewArrival: true,
              isSale: true,
              salePercentage: 16
            }
          };
        }
        
        setProduct(productData);
        
        // Debug product pricing
        console.log("ProductDetail: Price data structure:", {
          price: productData.price,
          basePrice: productData.basePrice,
          salePrice: productData.salePrice,
          discountPrice: productData.discountPrice,
          metadata: productData.metadata
        });
        
        // Set default selected color and size
        if (productData.colorVariants && productData.colorVariants.length > 0) {
          setSelectedColorIndex(0); // Default to first color
          
          // Get sizes for the selected color
          const selectedColorVariant = productData.colorVariants[0];
          if (selectedColorVariant.sizes && selectedColorVariant.sizes.length > 0) {
            setSelectedSize(selectedColorVariant.sizes[0].name);
          }
        }
        
        // Check if product is in wishlist
        if (isAuthenticated) {
          checkWishlistStatus(productData._id || productId);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [productId, isAuthenticated]);
  
  // Check if the product is in the wishlist
  const checkWishlistStatus = async (id) => {
    try {
      const response = await getWishlist();
      if (response.data) {
        const isInWishlist = response.data.some(item => 
          item._id === id || item.productId === id
        );
        setInWishlist(isInWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${productId}` } });
      return;
    }
    
    setWishlistLoading(true);
    
    try {
      if (inWishlist) {
        const response = await removeFromWishlist(productId);
        setInWishlist(false);
        // Update global wishlist state
        if (updateWishlist) {
          updateWishlist(response.data || []);
        }
      } else {
        const response = await addToWishlist(productId);
        setInWishlist(true);
        // Update global wishlist state
        if (updateWishlist) {
          updateWishlist(response.data || []);
        }
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert("Failed to update wishlist. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  // Get current color variant
  const getCurrentColorVariant = () => {
    if (!product || !product.colorVariants || product.colorVariants.length === 0) {
      return null;
    }
    
    return product.colorVariants[selectedColorIndex];
  };
  
  // Get the selected variant's images
  const getCurrentVariantImages = () => {
    const currentVariant = getCurrentColorVariant();
    if (!currentVariant || !currentVariant.images) {
      return [];
    }
    
    return currentVariant.images.map(img => img.url);
  };
  
  // Check if the currently selected size is in stock
  const isSizeInStock = (sizeName) => {
    const currentVariant = getCurrentColorVariant();
    if (!currentVariant || !currentVariant.sizes) {
      return false;
    }
    
    const sizeObj = currentVariant.sizes.find(s => s.name === sizeName);
    return sizeObj && sizeObj.quantity > 0;
  };
  
  // Check if the product is available to purchase
  const isProductAvailable = () => {
    // If there's no product or no color variants, assume it's not available
    if (!product) {
      return false;
    }
    
    // If there are no color variants, the product might still be available as a single item
    if (!product.colorVariants || product.colorVariants.length === 0) {
      // If there's no explicit color variants, assume the product is available
      return true;
    }
    
    const currentVariant = getCurrentColorVariant();
    if (!currentVariant) {
      return false;
    }
    
    // If there are no sizes for this color variant, assume the color itself is available
    if (!currentVariant.sizes || currentVariant.sizes.length === 0) {
      return true;
    }
    
    // If a size is selected, check if that specific size is in stock
    if (selectedSize) {
      return isSizeInStock(selectedSize);
    }
    
    // Otherwise check if any size is in stock
    return currentVariant.sizes.some(size => size.quantity > 0);
  };

  // Get available sizes for the selected color
  const getAvailableSizes = () => {
    const currentVariant = getCurrentColorVariant();
    if (!currentVariant || !currentVariant.sizes) {
      return [];
    }
    
    return currentVariant.sizes.map(size => ({
      name: size.name,
      inStock: size.quantity > 0
    }));
  };

  // Handle color selection
  const handleColorSelect = (index) => {
    setSelectedColorIndex(index);
    
    // Reset size selection
    const newColorVariant = product.colorVariants[index];
    if (newColorVariant.sizes && newColorVariant.sizes.length > 0) {
      setSelectedSize(newColorVariant.sizes[0].name);
    } else {
      setSelectedSize(null);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Safe price formatter that doesn't use toFixed
  const formatPrice = (price) => {
    try {
      if (price === undefined || price === null) {
        return '$0.00';
      }
      
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      if (isNaN(numPrice) || numPrice < 0) {
        return '$0.00';
      }
      
      // Round to 2 decimal places and format as string
      const roundedPrice = (Math.round(numPrice * 100) / 100)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
      // Ensure there are 2 decimal places
      const parts = roundedPrice.split('.');
      const formattedPrice = parts[0] + '.' + (parts[1] ? parts[1].padEnd(2, '0') : '00');
      return `$${formattedPrice}`;
    } catch (err) {
      console.error('Error formatting price in ProductDetail:', err);
      return '$0.00';
    }
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product.metadata && product.metadata.salePercentage) {
      return product.metadata.salePercentage;
    }
    
    if (product.basePrice && product.salePrice) {
      return Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100);
    }
    
    // If we have price and discountPrice but no salePrice
    if (product.price && product.discountPrice) {
      return Math.round(((product.price - product.discountPrice) / product.price) * 100);
    }
    
    return 0;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${productId}` } });
      return;
    }
    
    // Only validate size if we have color variants with sizes
    const currentVariant = getCurrentColorVariant();
    
    if (currentVariant && currentVariant.sizes && currentVariant.sizes.length > 0) {
      if (!selectedSize) {
        alert("Please select a size");
        return;
      }
      
      if (!isProductAvailable()) {
        alert("Selected size is not available");
        return;
      }
    }
    
    setAddToCartLoading(true);
    
    try {
      // Determine the product price to use
      let productPrice = 0;
      
      // Use sale price if available, otherwise use base price or regular price
      if (product.salePrice) {
        productPrice = product.salePrice;
      } else if (product.basePrice) {
        productPrice = product.basePrice;
      } else if (product.price) {
        productPrice = product.price;
      } else if (product.discountPrice) {
        productPrice = product.discountPrice;
      }
      
      // Get original price for discount calculations
      const originalPrice = product.basePrice || product.price || productPrice;
      
      // Create cart item based on whether we have color variants or not
      let cartItem = {
        productId: product._id || productId,
        quantity,
        price: productPrice,        // Include the price in the cart item
        originalPrice: originalPrice // Include original price for discount display
      };
      
      // Add color and size if available
      if (currentVariant) {
        cartItem = {
          ...cartItem,
          colorName: currentVariant.color.name,
          colorHex: currentVariant.color.hexCode,
          ...(selectedSize && { size: selectedSize })
        };
      }
      
      console.log('Adding to cart with data:', cartItem);
      console.log('Price details:', {
        addedPrice: productPrice,
        originalPrice: originalPrice,
        productPrices: {
          salePrice: product.salePrice,
          basePrice: product.basePrice,
          price: product.price,
          discountPrice: product.discountPrice
        }
      });
      
      const response = await addToCart(cartItem);
      
      // Make sure we're updating the global cart state
      if (updateCart) {
        console.log("Updating global cart state with:", response.data);
        updateCart(response.data);
        
        // Find cart icon in navbar and trigger a click to open cart popup
        const cartIconBtn = document.querySelector('.navbar-icon.cart-icon');
        if (cartIconBtn) {
          cartIconBtn.click();
        }
      } else {
        console.warn("updateCart function is not available in context");
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert("Failed to add product to cart");
    } finally {
      setAddToCartLoading(false);
    }
  };

  // Add this debug log after setting the product data
  useEffect(() => {
    if (product) {
      console.log("Product pricing data:", {
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        price: product.price,
        discountPrice: product.discountPrice
      });
    }
  }, [product]);

  // Convert image URLs to the format expected by the ProductImages component
  const formatImagesForProductImagesComponent = () => {
    const images = getCurrentVariantImages();
    return images.map(url => ({
      url: url,
      thumbnail: url, // Use the same URL for thumbnails
      alt: product.name
    }));
  };

  if (loading) {
    return <div className="product-detail-loading">Loading product details...</div>;
  }

  if (error) {
    return <div className="product-detail-error">{error}</div>;
  }

  if (!product) {
    return <div className="product-detail-error">Product not found</div>;
  }

  return (
    <div className="product-detail-container">
      <div className="product-breadcrumbs">
        <span>Home</span> / 
        <span>{product.category}</span>
        {product.subCategory && <> / <span>{product.subCategory}</span></>}
      </div>
      
      <div className="product-detail-content">
        {/* Product Images - Using our new ProductImages component */}
        <ProductImages 
          images={formatImagesForProductImagesComponent()} 
          productName={product.name} 
        />
        
        {/* Product Info */}
        <div className="product-info">
          <div className="product-header">
            {product.brand && <div className="product-brand">{product.brand}</div>}
            <h1 className="product-name">{product.name}</h1>
            
            <div className="product-meta">
              <div className="product-categories">
                {product.category && <span className="product-category">{product.category}</span>}
                {product.subCategory && <span className="product-subcategory">{product.subCategory}</span>}
              </div>
            </div>
          </div>
          
          {/* Product pricing */}
          <div className="product-price">
            {product.basePrice && product.price && product.basePrice > product.price ? (
              // Case 1: Modern pricing with basePrice > price (on sale)
              <>
                <span className="current-price">{formatPrice(product.price)}</span>
                <span className="original-price">{formatPrice(product.basePrice)}</span>
                <span className="discount-percent">
                  {getDiscountPercentage()}% off
                </span>
              </>
            ) : product.discountPrice && product.price ? (
              // Case 2: Legacy pricing with price and discountPrice
              <>
                <span className="current-price">{formatPrice(product.discountPrice)}</span>
                <span className="original-price">{formatPrice(product.price)}</span>
                <span className="discount-percent">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                </span>
              </>
            ) : product.salePrice && product.basePrice ? (
              // Case 3: Another pricing format with salePrice and basePrice
              <>
                <span className="current-price">{formatPrice(product.salePrice)}</span>
                <span className="original-price">{formatPrice(product.basePrice)}</span>
                <span className="discount-percent">
                  {Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}% off
                </span>
              </>
            ) : product.price ? (
              // Case 4: Simple pricing with just price
              <span className="current-price">{formatPrice(product.price)}</span>
            ) : product.basePrice ? (
              // Case 5: Fallback to basePrice if price is missing
              <span className="current-price">{formatPrice(product.basePrice)}</span>
            ) : (
              // Case 6: No pricing information available
              <span className="current-price">Price not available</span>
            )}
          </div>
          
          <div className="product-description">
            <p>{product.description}</p>
          </div>
          
          {/* Color variants selection */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <div className="product-colors">
              <h3 className="variant-label">Color:</h3>
              <div className="color-options">
                {product.colorVariants.map((variant, index) => (
                  <div 
                    key={index}
                    className={`color-option ${selectedColorIndex === index ? 'selected' : ''}`}
                    onClick={() => handleColorSelect(index)}
                    style={{ backgroundColor: variant.color.hexCode || variant.color }}
                    title={variant.color.name}
                  >
                    {selectedColorIndex === index && <span className="checkmark">✓</span>}
                  </div>
                ))}
              </div>
              <span className="selected-color-name">
                {product.colorVariants[selectedColorIndex]?.color.name}
              </span>
            </div>
          )}
          
          {/* Size selection */}
          {getAvailableSizes().length > 0 && (
            <div className="product-sizes">
              <div className="size-header">
                <h3 className="variant-label">Size:</h3>
                <button className="size-guide-btn">Size Guide</button>
              </div>
              <div className="size-options">
                {getAvailableSizes().map((size) => (
                  <div 
                    key={size.name}
                    className={`size-option ${selectedSize === size.name ? 'selected' : ''} ${!isSizeInStock(size.name) ? 'out-of-stock' : ''}`}
                    onClick={() => isSizeInStock(size.name) && setSelectedSize(size.name)}
                  >
                    {size.name}
                    {!isSizeInStock(size.name) && <span className="out-of-stock-label">Out of stock</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity selector */}
          <div className="product-quantity">
            <h3 className="variant-label">Quantity:</h3>
            <div className="quantity-selector">
              <button 
                className="quantity-btn"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
              >
                -
              </button>
              <input 
                type="number" 
                min="1" 
                max="99"
                value={quantity}
                onChange={handleQuantityChange}
                className="quantity-input"
              />
              <button 
                className="quantity-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="product-actions">
            <Button 
              variant="primary" 
              fullWidth
              onClick={handleAddToCart}
              disabled={addToCartLoading || !isProductAvailable()}
              loading={addToCartLoading}
              className="add-to-cart-btn"
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              {isProductAvailable() ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="wishlist-btn"
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <FontAwesomeIcon icon={inWishlist ? faHeart : farHeart} />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.share({
                  title: product.name,
                  text: product.description,
                  url: window.location.href
                }).catch(err => console.error('Error sharing:', err));
              }}
              className="share-btn"
              aria-label="Share this product"
            >
              <FontAwesomeIcon icon={faShare} />
            </Button>
          </div>
          
          {/* Product Details Section */}
          <div className="product-details-section">
            <h3 className="section-title">Product Details</h3>
            
            {product.features && product.features.length > 0 && (
              <div className="product-features">
                <h4><FontAwesomeIcon icon={faInfoCircle} /> Features</h4>
                <ul>
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {product.careInstructions && product.careInstructions.length > 0 && (
              <div className="product-care">
                <h4><FontAwesomeIcon icon={faInfoCircle} /> Care Instructions</h4>
                <ul>
                  {product.careInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {product.tags && product.tags.length > 0 && (
              <div className="product-tags">
                <h4><FontAwesomeIcon icon={faTag} /> Tags</h4>
                <div className="tags-list">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Product Reviews Section */}
      <div className="product-reviews-section" style={{ marginTop: '3rem', border: '1px solid #eee', padding: '1rem' }}>
        <h2>Customer Reviews</h2>
        <ProductReviews 
          productId={productId} 
          productName={product.name}
          product={product} 
        />
      </div>
      
      {/* Related Products Section - Now correctly positioned as a direct child of product-detail-container */}
      <RelatedProducts 
        productId={productId}
        currentProductCategory={product.category}
      />
    </div>
  );
};

export default ProductDetail; 