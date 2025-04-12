import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch, FaStar, FaFilter, FaTrash, FaEye, FaCheck, FaTimes, FaClock, FaFlag, FaSort } from 'react-icons/fa';
import axios from 'axios';
import Button from '../../common/Button';
import './ReviewsList.css';
import { getAdminReviews, deleteReview, updateReview } from './ReviewsApi';

// Create axios instance with correct baseURL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '', // Use API URL from env or empty string if not set
});

const ReviewsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState([]);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [limit] = useState(parseInt(searchParams.get('limit') || '10'));
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || 'all');
  const [productFilter, setProductFilter] = useState(searchParams.get('productId') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch reviews based on filters
  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = {
        page: currentPage,
        limit,
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (ratingFilter !== 'all') params.rating = ratingFilter;
      if (productFilter !== 'all') params.productId = productFilter;
      if (dateFilter !== 'all') params.date = dateFilter;
      
      // Add sorting
      if (sortBy === 'newest') params.sortBy = 'createdAt:desc';
      else if (sortBy === 'oldest') params.sortBy = 'createdAt:asc';
      else if (sortBy === 'highest') params.sortBy = 'rating:desc';
      else if (sortBy === 'lowest') params.sortBy = 'rating:asc';
      
      // Use our API service
      const reviewsData = await getAdminReviews(params);
      
      // Update state with fetched data
      setReviews(reviewsData.reviews || []);
      setTotalReviews(reviewsData.totalReviews || 0);
      setTotalPages(reviewsData.totalPages || 1);
      
      // Extract unique products from the reviews for the filter dropdown
      const uniqueProducts = [];
      const productMap = {};
      
      if (reviewsData.reviews && reviewsData.reviews.length > 0) {
        reviewsData.reviews.forEach(review => {
          if (review.productId && !productMap[review.productId]) {
            productMap[review.productId] = true;
            uniqueProducts.push({
              _id: review.productId,
              name: review.productName || 'Unknown Product'
            });
          }
        });
      }
      
      setProducts(uniqueProducts);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      setError(`Failed to load reviews. Please try again. (${err.message})`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReviews();
    
    // Update URL params
    const params = new URLSearchParams();
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (limit !== 10) params.set('limit', limit.toString());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (ratingFilter !== 'all') params.set('rating', ratingFilter);
    if (productFilter !== 'all') params.set('productId', productFilter);
    if (dateFilter !== 'all') params.set('date', dateFilter);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    setSearchParams(params);
    
  }, [currentPage, limit, statusFilter, ratingFilter, productFilter, dateFilter, sortBy, setSearchParams, fetchReviews]);
  
  // Handle filter changes
  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchReviews();
  };
  
  const resetFilters = () => {
    setStatusFilter('all');
    setRatingFilter('all');
    setProductFilter('all');
    setDateFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };
  
  // Handle pagination
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render star rating
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <FaStar key={i} className={i < rating ? 'star-filled' : 'star-empty'} />
    ));
  };
  
  // Handle review deletion
  const handleDeleteReview = async (reviewId, productId) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        // Use our API service to delete the review
        const result = await deleteReview(productId, reviewId);
        
        // Update UI optimistically
        setReviews(reviews.filter(review => review.reviewId !== reviewId));
        setTotalReviews(prevTotal => prevTotal - 1);
        
        // Show success message
        alert('Review deleted successfully');
      } catch (err) {
        console.error('Error deleting review:', err);
        
        // Check if it's likely an activity logging error but the review was deleted
        if (err.response && err.response.status === 500 && 
            err.response.data && err.response.data.error &&
            err.response.data.error.includes('AdminActivity validation failed')) {
          
          // Still update the UI since the operation likely succeeded
          setReviews(reviews.filter(review => review.reviewId !== reviewId));
          setTotalReviews(prevTotal => prevTotal - 1);
          
          alert('Review likely deleted successfully, but there was an error logging the activity.');
        } else {
          // Other types of errors
          alert(`Failed to delete review. Please try again. (${err.message})`);
        }
      }
    }
  };
  
  // Update review status
  const updateReviewStatus = async (productId, reviewId, newStatus) => {
    try {
      // Use our API service to update the review
      await updateReview(productId, reviewId, { status: newStatus });
      
      // Refresh reviews after update
      fetchReviews();
    } catch (err) {
      console.error('Error updating review:', err);
      
      // Check if it's likely an activity logging error but the review was updated
      if (err.response && err.response.status === 500 && 
          err.response.data && err.response.data.error &&
          err.response.data.error.includes('AdminActivity validation failed')) {
        
        // Refresh reviews anyway as the operation likely succeeded
        fetchReviews();
        
        alert('Review status likely updated successfully, but there was an error logging the activity.');
      } else {
        // Other types of errors
        alert(`Failed to update review status. Please try again. (${err.message})`);
      }
    }
  };
  
  // Render review status badge
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return '';
    }
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
  
  // Generate pagination array
  const getPaginationArray = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
      
      // Adjust start if end is too close to total
      if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - (maxVisiblePages - 3));
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  return (
    <div className="admin-reviews-list">
      <div className="reviews-header">
        <h1>Product Reviews</h1>
        <div className="header-actions">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <div className="reviews-count">
            {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>
      </div>
      
      {showFilters && (
        <div className="reviews-filters">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Rating</label>
            <select 
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Product</label>
            <select 
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Date</label>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      )}
      
      {loading && reviews.length === 0 ? (
        <div className="loading-indicator">Loading reviews...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews-message">
          <p>No reviews found matching your criteria.</p>
          {(statusFilter !== 'all' || ratingFilter !== 'all' || productFilter !== 'all' || dateFilter !== 'all') && (
            <button className="reset-filters-btn" onClick={resetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reviews-table-container">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Rating</th>
                  <th>Product</th>
                  <th>Review</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.reviewId} className={review.featured ? 'featured-review' : ''}>
                    <td className="rating-cell">
                      {renderStars(review.rating)}
                    </td>
                    <td>
                      <div className="product-info">
                        {review.productName}
                        <span className="product-id">ID: {review.productId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="review-content">
                        <div className="review-title">{review.title || 'Review'}</div>
                        <p className="review-text">
                          {(review.review || '').length > 80 
                            ? `${(review.review || '').substring(0, 80)}...` 
                            : (review.review || '')}
                        </p>
                        {review.images && review.images.length > 0 && (
                          <div className="review-images-indicator">
                            {review.images.length} image(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{review.user ? review.user.name : 'Anonymous'}</td>
                    <td>{formatDate(review.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(review.status)}`}>
                        {getStatusIcon(review.status)}
                        <span>{review.status}</span>
                      </span>
                      {review.featured && (
                        <span className="featured-badge">Featured</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => navigate(`/admin/reviews/${review.reviewId}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteReview(review.reviewId, review.productId)}
                          title="Delete Review"
                        >
                          <FaTrash />
                        </button>
                        
                        {review.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateReviewStatus(review.productId, review.reviewId, 'approved')}
                              className="approve-btn"
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => updateReviewStatus(review.productId, review.reviewId, 'rejected')}
                              className="reject-btn"
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          
          <div className="reviews-summary">
            Showing {reviews.length} of {totalReviews} reviews
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsList; 