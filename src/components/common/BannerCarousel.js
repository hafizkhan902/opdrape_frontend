import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import './BannerCarousel.css';

/**
 * BannerCarousel component displays promotional banners in a carousel
 * that can be clicked to navigate to category or product pages
 */
const BannerCarousel = ({ banners, autoplaySpeed = 5000, height = '400px' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  // Function to handle banner click
  const handleBannerClick = (banner) => {
    // Navigate to the banner's target page
    if (banner.link) {
      navigate(banner.link);
    }
  };

  // Function to move to the next slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
  }, [banners.length]);

  // Function to move to the previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
  };

  // Function to move to a specific slide
  const goToSlide = (index) => {
    setCurrentIndex(index);
    // Reset autoplay timer when manually changing slides
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 100);
  };

  // Set up autoplay
  useEffect(() => {
    let interval;
    
    if (isAutoPlaying && banners.length > 1) {
      interval = setInterval(() => {
        nextSlide();
      }, autoplaySpeed);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoPlaying, autoplaySpeed, nextSlide, banners.length]);

  // Pause autoplay when user interacts with the carousel
  const pauseAutoplay = () => {
    setIsAutoPlaying(false);
  };

  // Resume autoplay when user stops interacting
  const resumeAutoplay = () => {
    setIsAutoPlaying(true);
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="banner-carousel" 
      style={{ height }}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      <div className="banner-carousel-inner">
        {banners.map((banner, index) => (
          <div 
            key={banner.id || index}
            className={`banner-carousel-slide ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleBannerClick(banner)}
            style={{
              backgroundImage: `url(${banner.image})`,
              transform: `translateX(${(index - currentIndex) * 100}%)`
            }}
          >
            <div className="banner-content">
              {banner.title && <h2>{banner.title}</h2>}
              {banner.subtitle && <p>{banner.subtitle}</p>}
              {banner.buttonText && (
                <button className="banner-button">
                  {banner.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button 
            className="banner-carousel-arrow banner-carousel-prev"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous banner"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <button 
            className="banner-carousel-arrow banner-carousel-next"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next banner"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {banners.length > 1 && (
        <div className="banner-carousel-indicators">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to banner ${index + 1}`}
            >
              <FontAwesomeIcon icon={faCircle} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

BannerCarousel.propTypes = {
  banners: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      image: PropTypes.string.isRequired,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      buttonText: PropTypes.string,
      link: PropTypes.string
    })
  ).isRequired,
  autoplaySpeed: PropTypes.number,
  height: PropTypes.string
};

export default BannerCarousel; 