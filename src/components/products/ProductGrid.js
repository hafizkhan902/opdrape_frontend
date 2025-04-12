import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getProducts, getProductsByCategory, searchProducts } from '../../services/api';
import { ITEMS_PER_PAGE, MAX_PRICE_FILTER } from '../../config/env';
import ProductCard from './ProductCard';
import Button from '../common/Button';
import './ProductGrid.css';

const ProductGrid = ({ 
  title,
  category = null,
  searchQuery = null,
  initialFilters = {},
  showFilters: propShowFilters = true,
  wishlistItems = [],
  customFetch = null
}) => {
  // Get category from URL params if not provided as prop
  const { category: categoryParam } = useParams();
  const effectiveCategory = category || categoryParam;
  
  // Determine if filters should be shown
  // Don't show filters on category pages
  const showFilters = effectiveCategory ? false : propShowFilters;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    brands: [],
    priceRanges: [],
    colors: [],
    sizes: []
  });

  // Use environment variable for limit
  const limit = ITEMS_PER_PAGE;

  // Update URL search params when filters or sort changes
  useEffect(() => {
    const newParams = {};
    
    // Add page number to URL if not on first page
    if (page > 1) {
      newParams.page = page;
    }
    
    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (
        (Array.isArray(value) && value.length > 0) || 
        (!Array.isArray(value) && value !== '')
      )) {
        newParams[key] = Array.isArray(value) ? value.join(',') : value;
      }
    });
    
    setSearchParams(newParams);
  }, [filters, page, setSearchParams]);

  // Load products based on conditions (category, search, or regular listing)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const queryParams = {
        page,
        limit,
        ...filters
      };

      try {
        let response;

        // Use customFetch if provided
        if (customFetch) {
          response = await customFetch(queryParams);
        } else if (effectiveCategory) {
          // Fetch products by category
          response = await getProductsByCategory(effectiveCategory, queryParams);
        } else if (searchQuery) {
          // Search products
          response = await searchProducts({ 
            q: searchQuery,
            ...queryParams 
          });
        } else {
          // Fetch all products
          response = await getProducts(queryParams);
        }

        // Debug log to check product data structure
        console.log('Product data received:', response.data.products);
        
        // Ensure we have products array (defensive coding)
        if (!response.data.products) {
          console.warn('No products array in response, checking for alternative formats');
          
          // If the response data is directly an array, use that
          if (Array.isArray(response.data)) {
            console.log('Using response.data as products array');
            response.data = { 
              products: response.data,
              total: response.data.length
            };
          }
          // If no products array can be found, create an empty one
          else {
            console.warn('Could not find products array in response, using empty array');
            response.data = { products: [], total: 0 };
          }
        }
        
        // Check for products with missing IDs (check for MongoDB _id too)
        const productsWithMissingIds = response.data.products.filter(p => !p._id && !p.id && !p.slug);
        if (productsWithMissingIds.length > 0) {
          console.warn('Products with missing IDs, MongoDB _ids or slugs:', productsWithMissingIds);
        }

        // Log MongoDB IDs to help debugging
        const productsWithMongoIds = response.data.products.filter(p => p._id);
        if (productsWithMongoIds.length > 0) {
          console.log('Products with MongoDB _ids:', productsWithMongoIds.map(p => ({ _id: p._id, name: p.name })));
        }

        setProducts(response.data.products);
        setTotalProducts(response.data.total || response.data.products.length);
        
        // Set available filters from API response if present
        if (response.data.availableFilters) {
          setAvailableFilters(response.data.availableFilters);
        }
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        
        // Set empty products array as fallback
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [effectiveCategory, searchQuery, page, limit, filters, customFetch]);

  // Load filters and sort from URL on initial load
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    
    // Set page from URL
    if (params.page) {
      setPage(Number(params.page));
    }
    
    // Set filters from URL
    const urlFilters = {};
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'page') {
        // Handle comma-separated values as arrays
        if (value.includes(',')) {
          urlFilters[key] = value.split(',');
        } else {
          urlFilters[key] = value;
        }
      }
    });
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams]);

  // Update filter state
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      // If it's an array filter (like brands, sizes)
      if (Array.isArray(prev[filterName])) {
        if (prev[filterName].includes(value)) {
          // Remove value if already selected
          return {
            ...prev,
            [filterName]: prev[filterName].filter(item => item !== value)
          };
        } else {
          // Add value if not selected
          return {
            ...prev,
            [filterName]: [...prev[filterName], value]
          };
        }
      } else {
        // For single value filters
        return {
          ...prev,
          [filterName]: value
        };
      }
    });
    
    // Reset to first page when filters change
    setPage(1);
  };

  // Calculate total pages with fallback to prevent errors
  const totalPages = !isNaN(totalProducts) && Number.isFinite(totalProducts) && totalProducts > 0 ? 
    Math.max(1, Math.ceil(totalProducts / limit)) : 1;

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Safety check to ensure totalPages is a valid, reasonable number
    const safePages = !isNaN(totalPages) && Number.isFinite(totalPages) && totalPages > 0 ? 
      Math.min(totalPages, 100) : // Limit to max 100 pages to prevent performance issues
      1;
    
    // Generate page numbers array safely
    const pageNumbers = [];
    
    // For small number of pages, show all page numbers
    if (safePages <= 7) {
      for (let i = 1; i <= safePages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // For large number of pages, show current page, some around it, and first/last pages
      pageNumbers.push(1); // Always show first page
      
      // If not near first page, add ellipsis
      if (page > 3) {
        pageNumbers.push('...');
      }
      
      // Add pages around current page
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(safePages - 1, page + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // If not near last page, add ellipsis
      if (page < safePages - 2) {
        pageNumbers.push('...');
      }
      
      // Always show last page if there is more than one page
      if (safePages > 1) {
        pageNumbers.push(safePages);
      }
    }

    return (
      <div className="pagination">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
        >
          Previous
        </Button>
        
        <div className="pagination-pages">
          {pageNumbers.map((pageNum, index) => 
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={`page-${pageNum}`}
                className={`pagination-page ${page === pageNum ? 'active' : ''}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          )}
        </div>
        
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    );
  };

  // Render filters section
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className={`product-filters ${showMobileFilters ? 'show-mobile' : ''}`}>
        <div className="filters-header">
          <h3>Filters</h3>
          <button 
            className="close-filters"
            onClick={() => setShowMobileFilters(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Price Range Filter */}
        <div className="filter-section">
          <h4>Price Range</h4>
          <div className="price-range">
            <input 
              type="range" 
              min="0" 
              max={MAX_PRICE_FILTER} 
              value={filters.maxPrice || MAX_PRICE_FILTER}
              onChange={e => handleFilterChange('maxPrice', e.target.value)}
            />
            <div className="price-labels">
              <span>৳0</span>
              <span>৳{filters.maxPrice || MAX_PRICE_FILTER}</span>
            </div>
          </div>
        </div>

        {/* Brand Filter */}
        {availableFilters.brands.length > 0 && (
          <div className="filter-section">
            <h4>Brands</h4>
            <div className="checkbox-filters">
              {availableFilters.brands.map(brand => (
                <label key={brand.id} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={filters.brands?.includes(brand.id.toString())}
                    onChange={() => handleFilterChange('brands', brand.id.toString())}
                  />
                  {brand.name} ({brand.count})
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        <Button 
          variant="outline" 
          onClick={() => {
            setFilters(initialFilters);
            setPage(1);
          }}
          fullWidth
        >
          Clear Filters
        </Button>
      </div>
    );
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '৳0';
    }
    return `৳${price.toFixed(2)}`;
  };

  // Format category name for display (capitalize, replace hyphens with spaces)
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get display title 
  const displayTitle = title || (effectiveCategory ? `${formatCategoryName(effectiveCategory)} Collection` : 'All Products');

  return (
    <div className="product-grid-container">
      <div className="product-grid-header">
        {showFilters && (
          <button 
            className="mobile-filter-toggle"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <FontAwesomeIcon icon={showMobileFilters ? faTimes : faFilter} />
            {showMobileFilters ? 'Close Filters' : 'Filters'}
          </button>
        )}
        
        {displayTitle && <h2 className="product-grid-title">{displayTitle}</h2>}
        
        <div className="product-grid-actions">
        </div>
      </div>

      <div className="product-grid-content">
        {/* Filters Section */}
        {renderFilters()}
        
        {/* Products Section */}
        <div className="product-grid-results">
          {loading ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="primary"
              >
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-results">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="product-count">
                Showing {products.length} of {totalProducts} products
              </div>
              
              <div className="product-grid">
                {products
                  .filter(product => {
                    // Filter out completely invalid products
                    if (!product) {
                      console.warn('Filtering out undefined product');
                      return false;
                    }
                    
                    // Ensure product has an ID (either MongoDB _id, regular id, or slug)
                    if (!product._id && !product.id && !product.slug) {
                      console.warn('Filtering out product without ID:', product);
                      return false;
                    }
                    
                    return true;
                  })
                  .map(product => {
                    // Ensure we have a valid unique key using MongoDB _id first
                    const key = product._id || product.id || product.slug || `product-${Math.random()}`;
                    // For wishlist check, also consider MongoDB _id
                    const productIdentifier = product._id || product.id;
                    
                    return (
                      <ProductCard 
                        key={key} 
                        product={product} 
                        inWishlist={wishlistItems.includes(productIdentifier)}
                      />
                    );
                  })
                }
              </div>
              
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

ProductGrid.propTypes = {
  title: PropTypes.string,
  category: PropTypes.string,
  searchQuery: PropTypes.string,
  initialFilters: PropTypes.object,
  showFilters: PropTypes.bool,
  wishlistItems: PropTypes.array,
  customFetch: PropTypes.func
};

export default ProductGrid; 