import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaStar, 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaTrash, 
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaShoppingBag,
  FaFlag
} from 'react-icons/fa';
import axios from 'axios';
import './ReviewDetail.css';
import { getAdminReviews, getReviewById, updateReview, deleteReview } from './ReviewsApi';

// Define API endpoint with fallback
const API_ENDPOINT = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const ReviewDetail = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  
  // Form state for admin response and moderation
  const [adminResponse, setAdminResponse] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('pending');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch review data
  useEffect(() => {
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        // First get the list of all reviews
        console.log('Fetching all reviews to find the review with ID:', reviewId);
        const reviewsData = await getAdminReviews();
        
        // Find the current review in the list to get its productId
        const currentReview = reviewsData.reviews.find(r => r.reviewId === reviewId);
        
        if (!currentReview) {
          console.error('Review not found in the list. Review ID:', reviewId);
          console.log('Available reviews:', reviewsData.reviews.map(r => r.reviewId));
          throw new Error('Review not found');
        }
        
        console.log('Found matching review:', currentReview);
        
        // Now fetch the specific review details
        console.log(`Fetching detailed review data for review ${reviewId} of product ${currentReview.productId}`);
        const reviewData = await getReviewById(currentReview.productId, reviewId);
        
        console.log('Review data product info:', reviewData.product);
        
        // Initial product data from review
        const productData = {
          _id: currentReview.productId,
          name: currentReview.productName,
          sku: reviewData.productSku || 'N/A',
          price: reviewData.product?.price || reviewData.productPrice || 0,
          imageUrl: null // Initialize as null, we'll set it below
        };
        
        // Fetch full product details to get color variants
        try {
          console.log(`Fetching complete product data for product ${currentReview.productId}`);
          const productResponse = await axios.get(`${API_ENDPOINT}/products/${currentReview.productId}`);
          const fullProductData = productResponse.data;
          console.log('Full product data:', fullProductData);
          
          // Update product data with details from the full product response
          if (fullProductData) {
            // Update price if available
            if (fullProductData.price) {
              productData.price = fullProductData.price;
            }
            
            // Update SKU if available
            if (fullProductData.sku) {
              productData.sku = fullProductData.sku;
            }
            
            // Get image from color variants if available
            if (fullProductData.colorVariants && 
                fullProductData.colorVariants.length > 0 && 
                fullProductData.colorVariants[0].images && 
                fullProductData.colorVariants[0].images.length > 0) {
              
              const firstImage = fullProductData.colorVariants[0].images[0];
              console.log('First image from color variants:', firstImage);
              
              // Check if image is a string or an object with url property
              if (typeof firstImage === 'string') {
                productData.imageUrl = firstImage;
              } else if (firstImage && typeof firstImage === 'object') {
                productData.imageUrl = firstImage.url || firstImage.src || '';
              }
            }
          }
        } catch (err) {
          console.error('Error fetching full product details:', err);
          // Continue with limited product data from review if full product fetch fails
        }
        
        // Fallback to original review data for images if the full product fetch failed to get image
        if (!productData.imageUrl && reviewData.productImage) {
          productData.imageUrl = reviewData.productImage;
        }
        
        console.log('Final product data for review:', productData);
        
        // Use user information from the review
        const userData = currentReview.user || {
          _id: reviewData.userId,
          name: 'Customer',
          email: 'N/A',
          registeredDate: new Date(),
          totalOrders: 0,
          totalReviews: 1
        };
        
        // Set data in state
        setReview(reviewData);
        setProduct(productData);
        setUser(userData);
        
        // Initialize form state from review data
        setAdminResponse(reviewData.adminResponse || '');
        setFeatured(reviewData.featured || false);
        setStatus(reviewData.status || 'pending');
        
      } catch (err) {
        console.error('Error fetching review data:', err);
        console.error('Error details:', err.response ? err.response.data : 'No response data');
        setError(`Failed to load review details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviewData();
  }, [reviewId]);
  
  // Handle saving review status changes
  const handleSaveChanges = async () => {
    setSaving(true);
    setSuccessMessage('');
    
    try {
      if (!review || !review.productId) {
        throw new Error('Missing product ID for this review');
      }
      
      // Update the review using our API service
      console.log('Updating review with data:', { status, featured, adminResponse });
      const updatedReview = await updateReview(review.productId, reviewId, {
        status,
        featured,
        adminResponse
      });
      
      // Update review in state
      setReview({
        ...review,
        status,
        featured,
        adminResponse,
        updatedAt: new Date().toISOString()
      });
      
      // Show success message
      setSuccessMessage(updatedReview.message || 'Review updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      // Only display error if it's not the expected AdminActivity error
      // (which should have been handled by the API service already)
      console.error('Unhandled error when updating review:', err);
      setError(`Failed to update review: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle review deletion
  const handleDeleteReview = async () => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        if (!review || !review.productId) {
          throw new Error('Missing product ID for this review');
        }
        
        // Delete the review using our API service
        const result = await deleteReview(review.productId, reviewId);
        
        // Navigate back to reviews list
        // If result includes a message about logging error, show that before navigating
        if (result && result.message && result.message.includes('logging error')) {
          alert('Review deleted successfully, but there was an error logging the activity.');
        }
        
        navigate('/admin/reviews');
        
      } catch (err) {
        // Only display error if it's not already handled by the API service
        console.error('Unhandled error when deleting review:', err);
        setError(`Failed to delete review: ${err.message}`);
      }
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render star rating
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <FaStar key={i} className={i < rating ? 'star-filled' : 'star-empty'} />
    ));
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheck className="status-icon approved" />;
      case 'rejected': return <FaTimes className="status-icon rejected" />;
      case 'pending': return <FaClock className="status-icon pending" />;
      default: return null;
    }
  };
  
  if (loading) {
    return <div className="loading-indicator">Loading review details...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="back-button"
          onClick={() => navigate('/admin/reviews')}
        >
          <FaArrowLeft /> Back to Reviews
        </button>
      </div>
    );
  }
  
  if (!review) {
    return (
      <div className="error-container">
        <div className="error-message">Review not found</div>
        <button 
          className="back-button"
          onClick={() => navigate('/admin/reviews')}
        >
          <FaArrowLeft /> Back to Reviews
        </button>
      </div>
    );
  }
  
  return (
    <div className="review-detail-container">
      <div className="review-detail-header">
        <Link to="/admin/reviews" className="back-link">
          <FaArrowLeft /> Back to Reviews
        </Link>
        <div className="review-actions">
          <button 
            className="delete-review-btn"
            onClick={handleDeleteReview}
          >
            <FaTrash /> Delete Review
          </button>
        </div>
      </div>
      
      <div className="review-detail-content">
        <div className="review-detail-main">
          <div className="review-info-section">
            <div className="review-header">
              <div className="review-rating">
                {renderStars(review.rating)}
                <span className="rating-number">{review.rating}/5</span>
              </div>
              <div className="review-status">
                {getStatusIcon(review.status)}
                <span className={`status-text ${review.status}`}>{review.status}</span>
                {review.featured && (
                  <span className="featured-badge">
                    <FaFlag /> Featured
                  </span>
                )}
              </div>
            </div>
            
            <h2 className="review-title">{review.title || 'Review'}</h2>
            <p className="review-content">{review.review || ''}</p>
            
            {review.images && review.images.length > 0 && (
              <div className="review-images">
                <h3>Images ({review.images.length})</h3>
                <div className="image-gallery">
                  {review.images.map((image, index) => (
                    <a 
                      key={index} 
                      href={image} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="image-item"
                    >
                      <img src={image} alt={`Review image ${index + 1}`} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {review.adminResponse && (
              <div className="admin-response-display">
                <h3>Admin Response</h3>
                <p>{review.adminResponse}</p>
                <span className="response-date">
                  Responded on {formatDate(review.updatedAt)}
                </span>
              </div>
            )}
          </div>
          
          <div className="moderation-section">
            <h3>Moderate Review</h3>
            
            <div className="form-group">
              <label>Review Status</label>
              <div className="status-buttons">
                <button 
                  className={`status-btn ${status === 'approved' ? 'active' : ''}`}
                  onClick={() => setStatus('approved')}
                >
                  <FaCheck /> Approve
                </button>
                <button 
                  className={`status-btn ${status === 'rejected' ? 'active' : ''}`}
                  onClick={() => setStatus('rejected')}
                >
                  <FaTimes /> Reject
                </button>
                <button 
                  className={`status-btn ${status === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatus('pending')}
                >
                  <FaClock /> Pending
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Feature this review (display prominently on product page)
              </label>
            </div>
            
            <div className="form-group">
              <label>Admin Response</label>
              <textarea 
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter a response to this review (optional)"
                rows={4}
              />
            </div>
            
            <div className="form-actions">
              <button 
                className="save-btn"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {successMessage && (
                <div className="success-message">
                  {successMessage}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="review-detail-sidebar">
          {product && (
            <div className="sidebar-section">
              <h3>Product Information</h3>
              <div className="product-card">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="product-image"
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      // If the image fails to load, replace with the SVG placeholder
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentNode.insertAdjacentHTML(
                        'afterbegin',
                        `<div class="product-image-placeholder">
                          <svg width="80%" height="80%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100" height="100" fill="#f0f0f0" />
                            <text x="50%" y="50%" fontFamily="Arial" fontSize="12" fill="#999" textAnchor="middle">No Image</text>
                          </svg>
                        </div>`
                      );
                    }}
                  />
                ) : (
                  <div className="product-image-placeholder">
                    <svg width="80%" height="80%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100" height="100" fill="#f0f0f0" />
                      <text x="50%" y="50%" fontFamily="Arial" fontSize="12" fill="#999" textAnchor="middle">No Image</text>
                    </svg>
                  </div>
                )}
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p className="product-sku">SKU: {product.sku}</p>
                  <Link to={`/product/${product._id}`} className="view-product-link">
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {user && (
            <div className="sidebar-section">
              <h3>Customer Information</h3>
              <div className="customer-info">
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <strong>{user.name || 'Customer'}</strong>
                    <span className="info-secondary">{user.email || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div>
                    <strong>Registered</strong>
                    <span className="info-secondary">{formatDate(user.registeredDate)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaShoppingBag className="info-icon" />
                  <div>
                    <strong>{user.totalOrders || 0} Orders</strong>
                    <span className="info-secondary">{user.totalReviews || 0} Reviews</span>
                  </div>
                </div>
                <Link to={`/admin/customers/${user._id}`} className="view-customer-link">
                  View Customer Profile
                </Link>
              </div>
            </div>
          )}
          
          <div className="sidebar-section">
            <h3>Review Details</h3>
            <div className="detail-item">
              <span className="detail-label">Review ID</span>
              <span className="detail-value">{review.reviewId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Submitted</span>
              <span className="detail-value">{formatDate(review.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">{formatDate(review.updatedAt || review.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail; 