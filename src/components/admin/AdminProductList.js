import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminProducts, deleteProduct } from '../../services/api';
import './AdminProductList.css';
import { 
  FaPlus, FaSearch, FaFilter, FaSort, FaEye, FaEdit, 
  FaTrashAlt, FaSpinner, FaExclamationTriangle, FaBox, 
  FaSearch as FaSearchThin, FaCheck
} from 'react-icons/fa';

const AdminProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Memoized fetchProducts function to avoid unnecessary re-renders
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare query parameters based on filters
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      
      // Set sort parameter based on user selection
      switch(sortBy) {
        case 'newest':
          params.sort = '-createdAt';
          break;
        case 'oldest':
          params.sort = 'createdAt';
          break;
        case 'priceHighToLow':
          params.sort = '-price';
          break;
        case 'priceLowToHigh':
          params.sort = 'price';
          break;
        case 'nameAZ':
          params.sort = 'name';
          break;
        case 'nameZA':
          params.sort = '-name';
          break;
        default:
          params.sort = '-createdAt';
      }

      const response = await getAdminProducts(params);
      
      // Handle different response formats
      let productData = [];
      if (response.data && Array.isArray(response.data)) {
        productData = response.data;
      } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
        productData = response.data.products;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find an array property in the response
        const arrayProps = Object.entries(response.data)
          .find(([key, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          productData = arrayProps[1];
        }
      }
      
      setProducts(productData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sortBy]); // Include dependencies

  // Fetch products from API when component mounts or filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Now fetchProducts is properly included

  // Helper function to extract the main product image
  const getProductImage = (product) => {
    // First try to get image directly from product.image (as used in ProductCard)
    if (product.image) {
      return product.image;
    }
    
    // If no direct image, try to get from colorVariants (as in the current approach)
    if (product.colorVariants && 
        product.colorVariants.length > 0 && 
        product.colorVariants[0].images && 
        product.colorVariants[0].images.length > 0) {
      return product.colorVariants[0].images[0].url || 
             product.colorVariants[0].images[0].src || 
             product.colorVariants[0].images[0];
    }
    
    // Fallback to placeholder
    return 'https://via.placeholder.com/50';
  };

  // Helper function to get product price from various possible locations
  const getProductPrice = (product) => {
    // Check direct price property first
    if (product.price !== undefined && product.price !== null) {
      return product.price;
    }
    
    // Check for variants/pricing structure
    if (product.variants && product.variants.length > 0 && product.variants[0].price) {
      return product.variants[0].price;
    }
    
    // Check for pricing object
    if (product.pricing && product.pricing.price) {
      return product.pricing.price;
    }
    
    // Check for basePrice
    if (product.basePrice) {
      return product.basePrice;
    }
    
    // Check for salePrice or regular price
    if (product.salePrice) {
      return product.salePrice;
    }
    
    if (product.regularPrice) {
      return product.regularPrice;
    }
    
    // Default fallback
    return 0;
  };

  // Helper function to get product stock from various possible locations
  const getProductStock = (product) => {
    // Check if product has colorVariants with sizes that contain quantities
    if (product.colorVariants && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
      let totalQuantity = 0;
      
      // Loop through each color variant
      product.colorVariants.forEach(variant => {
        // Check if this variant has sizes array
        if (variant.sizes && Array.isArray(variant.sizes) && variant.sizes.length > 0) {
          // Sum up quantities from all sizes
          variant.sizes.forEach(size => {
            if (size.quantity !== undefined && size.quantity !== null) {
              totalQuantity += Number(size.quantity);
            }
          });
        }
      });
      
      if (totalQuantity > 0) {
        return totalQuantity;
      }
    }
    
    // Direct access to quantity
    if (typeof product.quantity !== 'undefined') {
      return Number(product.quantity);
    }
    
    // Try accessing quantity as a string that needs conversion
    if (typeof product.quantity === 'string' && !isNaN(product.quantity)) {
      return parseInt(product.quantity, 10);
    }
    
    // Check direct stock property
    if (product.stock !== undefined && product.stock !== null) {
      return Number(product.stock);
    }
    
    // Check for inventory property
    if (product.inventory !== undefined && product.inventory !== null) {
      return Number(product.inventory);
    }
    
    // Check variants (simple variants, not color variants)
    if (product.variants && product.variants.length > 0) {
      if (product.variants[0].quantity !== undefined) {
        return Number(product.variants[0].quantity);
      }
      if (product.variants[0].stock !== undefined) {
        return Number(product.variants[0].stock);
      }
      if (product.variants[0].inventory !== undefined) {
        return Number(product.variants[0].inventory);
      }
    }
    
    // Check for inventoryLevel
    if (product.inventoryLevel !== undefined && product.inventoryLevel !== null) {
      return Number(product.inventoryLevel);
    }
    
    // Check for nested properties
    const possibleProps = [
      'inventoryDetails.quantity',
      'inventory.quantity',
      'details.quantity',
      'productDetails.quantity',
      'stockDetails.quantity'
    ];
    
    for (const propPath of possibleProps) {
      const value = propPath.split('.').reduce((obj, prop) => obj && obj[prop], product);
      if (value !== undefined && value !== null) {
        return Number(value);
      }
    }
    
    // Return 0 if no stock info is found
    return 0;
  };

  // Get stock status class and label based on quantity
  const getStockStatus = (quantity) => {
    if (quantity > 10) {
      return { class: 'in-stock', label: 'In Stock' };
    } else if (quantity > 0) {
      return { class: 'low-stock', label: 'Low Stock' };
    } else {
      return { class: 'out-of-stock', label: 'Out of Stock' };
    }
  };

  // Handle product deletion
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteProduct(productToDelete._id);
      setDeleteSuccess(true);
      // Update products list after successful deletion
      setProducts(products.filter(p => p._id !== productToDelete._id));
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeleteSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError('Failed to delete the product. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel deletion and reset state
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Extract unique categories for filter dropdown
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  // Format price for display
  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return '৳0.00';
    }
    return `৳${price.toFixed(2)}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Navigation functions
  const viewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const editProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const addProduct = () => {
    navigate('/admin/products/add');
  };

  // Render loading state
  if (loading && products.length === 0) {
    return (
      <div className="admin-products-container">
        <div className="loading-state">
          <FaSpinner className="loading-icon fa-spin" />
          <h2>Loading Products</h2>
          <p>Please wait while we fetch the product data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && products.length === 0) {
    return (
      <div className="admin-products-container">
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <h2>Failed to Load Products</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={fetchProducts}>
            <FaSearch /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (products.length === 0) {
    return (
      <div className="admin-products-container">
        <div className="admin-products-header">
          <h1>Products</h1>
          <button className="add-product-button" onClick={addProduct}>
            <FaPlus /> Add Product
          </button>
        </div>
        
        <div className="empty-state">
          <FaBox className="empty-icon" />
          <h2>No Products Found</h2>
          <p>You haven't added any products yet. Click the button below to add your first product.</p>
          <button className="primary-button" onClick={addProduct}>
            <FaPlus /> Add First Product
          </button>
        </div>
      </div>
    );
  }

  // Render no results state
  if (filteredProducts.length === 0) {
    return (
      <div className="admin-products-container">
        <div className="admin-products-header">
          <h1>Products</h1>
          <button className="add-product-button" onClick={addProduct}>
            <FaPlus /> Add Product
          </button>
        </div>
        
        <div className="products-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <div className="category-filter">
              <FaFilter className="filter-icon" />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-options">
              <FaSort className="sort-icon" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priceHighToLow">Price: High to Low</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="nameAZ">Name: A to Z</option>
                <option value="nameZA">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="no-results-state">
          <FaSearchThin className="no-results-icon" />
          <h2>No Products Found</h2>
          <p>No products match your search criteria. Try adjusting your filters or search term.</p>
          <button className="secondary-button" onClick={() => {
            setSearchTerm('');
            setCategoryFilter('');
          }}>
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  // Main render - products list
  return (
    <div className="admin-products-container">
      <div className="admin-products-header">
        <h1>Products</h1>
        <button className="add-product-button" onClick={addProduct}>
          <FaPlus /> Add Product
        </button>
      </div>
      
      <div className="products-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="category-filter">
            <FaFilter className="filter-icon" />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sort-options">
            <FaSort className="sort-icon" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceHighToLow">Price: High to Low</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="nameAZ">Name: A to Z</option>
              <option value="nameZA">Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th className="product-image">Image</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td className="product-image">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/50';
                      console.log('Image failed to load for product:', product.name);
                    }}
                  />
                </td>
                <td className="product-name">{product.name}</td>
                <td className="product-sku">{product.sku || 'N/A'}</td>
                <td className="product-category">
                  {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'N/A'}
                </td>
                <td className="product-price">{formatPrice(getProductPrice(product))}</td>
                <td className="product-stock">
                  {(() => {
                    const stockQty = getProductStock(product);
                    const status = getStockStatus(stockQty);
                    
                    return (
                      <span className={`stock-badge ${status.class}`}>
                        {stockQty}
                      </span>
                    );
                  })()}
                </td>
                <td className="product-date">
                  {formatDate(product.createdAt)}
                </td>
                <td className="product-actions">
                  <button 
                    className="action-button view" 
                    onClick={() => viewProduct(product._id)}
                    title="View product"
                  >
                    <FaEye />
                  </button>
                  <button 
                    className="action-button edit" 
                    onClick={() => editProduct(product._id)}
                    title="Edit product"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="action-button delete" 
                    onClick={() => confirmDelete(product)}
                    title="Delete product"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            {deleteSuccess ? (
              <div className="delete-success">
                <FaCheck className="success-icon" />
                <h2>Product Deleted</h2>
                <p>The product was successfully deleted.</p>
              </div>
            ) : (
              <>
                <h2>Delete Product</h2>
                <p>
                  Are you sure you want to delete <strong>{productToDelete?.name}</strong>? 
                  This action cannot be undone.
                </p>
                
                {deleteError && (
                  <div className="delete-error">
                    <FaExclamationTriangle />
                    <p>{deleteError}</p>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button 
                    className="secondary-button" 
                    onClick={cancelDelete} 
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="danger-button" 
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <FaSpinner className="fa-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrashAlt /> Delete
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductList;