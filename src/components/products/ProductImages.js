import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ProductImages.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faExpand } from '@fortawesome/free-solid-svg-icons';

/**
 * ProductImages component for displaying product images with thumbnails and image zoom functionality
 * Uses data passed from the parent ProductDetail component
 */
const ProductImages = ({ images, productName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  // Handle image selection from thumbnails
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
    setIsZoomed(false);
  };

  // Handle next/previous image navigation
  const navigateImage = (direction) => {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
      setIsZoomed(false);
    }
  };

  // Handle image zoom functionality
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Handle mouse movement when zoomed
  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ x, y });
  };

  // Render placeholder if no images are available
  if (!images || images.length === 0) {
    return (
      <div className="product-images">
        <div className="product-image-main no-image">
          <div className="no-image-placeholder">No images available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-images-container">
      {/* Main image display */}
      <div 
        className={`product-image-main ${isZoomed ? 'zoomed' : ''}`}
        onMouseMove={handleMouseMove}
        onClick={toggleZoom}
      >
        <img 
          src={images[currentImageIndex].url} 
          alt={`${productName} - ${images[currentImageIndex].alt || 'Product image'}`}
          style={isZoomed ? {
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
          } : {}}
        />
        
        {/* Zoom indicator */}
        {!isZoomed && (
          <button className="zoom-button" onClick={toggleZoom}>
            <FontAwesomeIcon icon={faExpand} />
          </button>
        )}
        
        {/* Navigation arrows */}
        <button 
          className="nav-button left"
          onClick={(e) => {
            e.stopPropagation();
            navigateImage(-1);
          }}
          disabled={currentImageIndex === 0}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        <button 
          className="nav-button right"
          onClick={(e) => {
            e.stopPropagation();
            navigateImage(1);
          }}
          disabled={currentImageIndex === images.length - 1}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      
      {/* Thumbnails */}
      <div className="product-thumbnails">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
            onClick={() => handleThumbnailClick(index)}
          >
            <img 
              src={image.thumbnail || image.url} 
              alt={`${productName} thumbnail ${index + 1}`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

ProductImages.propTypes = {
  // Array of image objects with url and optional alt text
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      thumbnail: PropTypes.string,
      alt: PropTypes.string
    })
  ).isRequired,
  productName: PropTypes.string.isRequired
};

export default ProductImages; 