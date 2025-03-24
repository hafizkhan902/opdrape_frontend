import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faTag } from '@fortawesome/free-solid-svg-icons';
import { getProductsByCategory, getProductsByTag } from '../../services/api';
import ProductGrid from './ProductGrid';
import './BannerProductsPage.css';

/**
 * BannerProductsPage displays products related to a specific promotional banner or tag
 * It takes the category/tag from the URL parameter
 */
const BannerProductsPage = () => {
  const { category: urlParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [isTag, setIsTag] = useState(false);

  // Map category slugs to display names and descriptions
  const categoryInfo = {
    'summer': {
      title: 'Summer Collection',
      description: 'Discover the latest fashion trends for the summer season.',
      image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
    },
    'new-arrivals': {
      title: 'New Arrivals',
      description: 'The latest additions to our collection, fresh off the runway.',
      image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
    },
    'offers': {
      title: 'Special Offers',
      description: 'Don\'t miss out on our limited-time discounts and exclusive deals.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
    },
    // Add more categories as needed
  };

  // Validate and get category/tag information
  useEffect(() => {
    setLoading(true);
    
    if (!urlParam) {
      setError('Invalid URL parameter');
      setLoading(false);
      return;
    }

    // For the banner/:tag endpoint, treat all URL parameters as tags
    // but still use predefined info from categoryInfo if available
    setIsTag(true);
    
    // Format the tag name for display if not in our predefined list
    if (categoryInfo[urlParam]) {
      // Use predefined info for known categories/tags
      setPageTitle(categoryInfo[urlParam].title);
      setPageDescription(categoryInfo[urlParam].description);
      setBannerImage(categoryInfo[urlParam].image);
      setError(null);
    } else {
      // Format the tag name for display (capitalize, replace hyphens with spaces)
      const formattedTagName = urlParam
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setPageTitle(`${formattedTagName} Collection`);
      setPageDescription(`Explore our products tagged with "${formattedTagName}".`);
      
      // Get a generic banner image based on the tag name
      setBannerImage(`https://source.unsplash.com/random/1200x400/?fashion,${urlParam}`);
      setError(null);
    }
    
    setLoading(false);
  }, [urlParam]);

  // Handle back button click
  const handleBackClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="banner-products-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="banner-products-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBackClick} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="banner-products-page">
      <div 
        className="banner-header" 
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="banner-overlay">
          <div className="banner-header-content">
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
            {isTag && (
              <div className="tag-badge">
                <FontAwesomeIcon icon={faTag} />
                <span>{urlParam}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="banner-products-nav">
        <button onClick={handleBackClick} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
        </button>
      </div>
      
      <div className="banner-products-content">
        <ProductGrid 
          title={`${pageTitle} Products`}
          customFetch={(params) => getProductsByTag(urlParam, params)}
          showFilters={false}
        />
      </div>
    </div>
  );
};

export default BannerProductsPage; 