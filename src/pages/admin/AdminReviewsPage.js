import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ReviewsList from '../../components/admin/reviews/ReviewsList';
import ReviewDetail from '../../components/admin/reviews/ReviewDetail';
import './AdminReviewsPage.css';

const AdminReviewsPage = () => {
  const params = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  
  // Debug info
  console.log('AdminReviewsPage - Current path:', location.pathname);
  console.log('AdminReviewsPage - Path parts:', pathParts);
  console.log('AdminReviewsPage - Params:', params);
  
  // Determine which component to render based on the URL
  const renderComponent = () => {
    // If we're at /admin/reviews/ID - show review details
    if (pathParts.length >= 4 && pathParts[3] && pathParts[3].length > 0) {
      return <ReviewDetail />;
    }
    
    // Default: show reviews list at /admin/reviews
    return <ReviewsList />;
  };

  return (
    <div className="admin-reviews-container">
      {renderComponent()}
    </div>
  );
};

export default AdminReviewsPage; 