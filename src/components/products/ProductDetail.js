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
  const [success, setSuccess] = useState(null);

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
    
    // Reset size selection when color changes
    const newColorVariant = product.colorVariants[index];
    setSelectedSize(null); // Reset size when color changes
    
    // Auto-select first available size if any
    if (newColorVariant.sizes && newColorVariant.sizes.length > 0) {
      const firstAvailableSize = newColorVariant.sizes.find(size => size.quantity > 0);
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize.name);
      }
    }
  };

  // Handle size selection
  const handleSizeSelect = (sizeName) => {
    if (isSizeInStock(sizeName)) {
      setSelectedSize(sizeName);
    }
  };

  // Validate before adding to cart
  const validateSelection = () => {
    const currentVariant = getCurrentColorVariant();
    
    if (!currentVariant) {
      alert("Please select a color");
      return false;
    }
    
    if (currentVariant.sizes && currentVariant.sizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return false;
    }
    
    if (!isProductAvailable()) {
      alert("Selected combination is not available");
      return false;
    }
    
    return true;
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
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
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
    try {
      if (!selectedSize) {
        setError('Please select a size');
        return;
      }

      const currentVariant = getCurrentColorVariant();
      if (!currentVariant) {
        setError('Please select a color');
        return;
      }

      setLoading(true);
      setError(null);

      // Get the product ID - use _id if available, otherwise use the URL productId
      const productIdentifier = product._id || productId;

      // Format the cart item data according to the required structure
      const cartItemData = {
        productId: productIdentifier,  // Use productId as the key
        colorVariant: {
          color: {
            name: currentVariant.color.name,
            hexCode: currentVariant.color.hexCode
          }
        },
        size: {
          name: selectedSize,
          quantity: quantity
        }
      };

      console.log('Adding to cart:', cartItemData);
      const response = await addToCart(cartItemData);
      
      // Show success message
      setSuccess('Product added to cart successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      // Update cart if the function exists
      if (updateCart && response.data) {
        // Ensure we're passing the correct cart data structure
        const cartData = {
          items: response.data.items || [],
          totalAmount: response.data.totalAmount || 0
        };
        updateCart(cartData);
      }

      // Show cart popup
      setShowCartPopup(true);
      
      // Hide cart popup after 3 seconds
      setTimeout(() => {
        setShowCartPopup(false);
      }, 3000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(error.message || 'Failed to add product to cart');
    } finally {
      setLoading(false);
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
        <div className="product-images">
          <ProductImages images={formatImagesForProductImagesComponent()} />
        </div>
        
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-price">
            {product.salePrice ? (
              <>
                <span className="sale-price">{formatPrice(product.salePrice)}</span>
                <span className="original-price">{formatPrice(product.basePrice)}</span>
                <span className="discount-badge">-{getDiscountPercentage()}%</span>
              </>
            ) : (
              <span className="regular-price">{formatPrice(product.basePrice)}</span>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="product-options">
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="color-options">
                <label>Color: <span className="selected-color">{getCurrentColorVariant()?.color?.name}</span></label>
                <div className="color-swatches">
                  {product.colorVariants.map((variant, index) => (
                    <button
                      key={variant.color.hexCode}
                      className={`color-swatch ${selectedColorIndex === index ? 'selected' : ''}`}
                      style={{ backgroundColor: variant.color.hexCode }}
                      onClick={() => handleColorSelect(index)}
                      title={variant.color.name}
                      aria-label={`Select ${variant.color.name} color`}
                    >
                      {selectedColorIndex === index && <span className="check-mark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {getAvailableSizes().length > 0 && (
              <div className="size-options">
                <label>Size: <span className="selected-size">{selectedSize || 'Select Size'}</span></label>
                <div className="size-buttons">
                  {getAvailableSizes().map(({ name, inStock }) => (
                    <button
                      key={name}
                      className={`size-button ${selectedSize === name ? 'selected' : ''} ${!inStock ? 'out-of-stock' : ''}`}
                      onClick={() => handleSizeSelect(name)}
                      disabled={!inStock}
                    >
                      {name}
                      {!inStock && <span className="out-of-stock-label">Out of Stock</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="quantity-selector">
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="quantity-input"
              />
            </div>
          </div>
          
          <div className="product-actions">
            <Button
              onClick={handleAddToCart}
              disabled={loading || !isProductAvailable()}
              className="add-to-cart-button"
            >
              {loading ? 'Adding...' : 'Add to Cart'}
              <FontAwesomeIcon icon={faShoppingCart} className="button-icon" />
            </Button>
            
            <Button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`wishlist-button ${inWishlist ? 'in-wishlist' : ''}`}
            >
              <FontAwesomeIcon icon={inWishlist ? faHeart : farHeart} />
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
          
          <div className="product-description">
            <h2>Product Description</h2>
            <p>{product.description}</p>
          </div>
          
          {product.features && product.features.length > 0 && (
            <div className="product-features">
              <h2>Features</h2>
              <ul>
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          {product.careInstructions && product.careInstructions.length > 0 && (
            <div className="care-instructions">
              <h2>Care Instructions</h2>
              <ul>
                {product.careInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
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