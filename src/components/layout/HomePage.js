import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import BannerCarousel from '../common/BannerCarousel';
import ProductGrid from '../products/ProductGrid';
import usePromotionalBanners from '../../hooks/usePromotionalBanners';
import './HomePage.css';

/**
 * HomePage component that displays the banner carousel and featured products
 */
const HomePage = () => {
  const { banners, loading, error } = usePromotionalBanners();

  return (
    <div className="home-page">
      {/* Banner Carousel Section */}
      <section className="banner-section">
        {loading ? (
          <div className="banner-loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Loading promotions...</p>
          </div>
        ) : error ? (
          <div className="banner-error">
            <p>{error}</p>
          </div>
        ) : (
          <BannerCarousel 
            banners={banners} 
            autoplaySpeed={5000}
            height="500px"
          />
        )}
      </section>

      {/* Featured Products Section */}
      <section className="featured-products-section">
        <ProductGrid 
          title="Featured Products" 
          showFilters={false}
          initialFilters={{ featured: true }}
        />
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-cards">
          <Link 
            to="/products/category/men"
            className="category-card" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80)'
            }}
          >
            <div className="category-card-overlay">
              <h3>Men</h3>
            </div>
          </Link>
          <Link 
            to="/products/category/women"
            className="category-card" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80)'
            }}
          >
            <div className="category-card-overlay">
              <h3>Women</h3>
            </div>
          </Link>
          <Link 
            to="/products/category/kids"
            className="category-card" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80)'
            }}
          >
            <div className="category-card-overlay">
              <h3>Kids</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Special Offers Section */}
      {/* <section className="special-offers-section">
        <h2 className="section-title">Special Offers</h2>
        <p className="section-subtitle">
          Limited time deals on popular products
        </p>
        <ProductGrid 
          title="Special Offers" 
          showFilters={false}
          initialFilters={{ onSale: true }}
          initialSortOption="discount"
        />
      </section> */}
    </div>
  );
};

export default HomePage; 