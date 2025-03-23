import React from 'react';
import { FaTag, FaStar, FaFire, FaPercent, FaTv, FaHome, FaTrophy, FaShoppingBag, FaAd } from 'react-icons/fa';
import './ProductMetadataForm.css';

/**
 * ProductMetadataForm component for handling product flags and metadata
 * - Used within the AdminProductForm to manage product metadata fields
 * - Handles special product flags like "New Arrival", "Best Seller", "On Sale"
 */
const ProductMetadataForm = ({ metadata, onChange, errors }) => {
  // Handle checkbox change for boolean flags
  const handleCheckboxChange = (field) => {
    onChange({
      ...metadata,
      [field]: !metadata[field]
    });
  };

  // Handle numeric value change
  const handleNumberChange = (field, value) => {
    onChange({
      ...metadata,
      [field]: value === '' ? 0 : Number(value)
    });
  };

  // Get icon for display page
  const getDisplayPageIcon = (page) => {
    switch(page) {
      case 'home': return <FaHome />;
      case 'featured': return <FaStar />;
      case 'new-arrivals': return <FaTag />;
      case 'best-sellers': return <FaTrophy />;
      case 'promotions': return <FaAd />;
      default: return <FaTv />;
    }
  };

  return (
    <div className="product-metadata-form">
      <div className="metadata-grid">
        <div className="metadata-item">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="isNewArrival"
              checked={metadata.isNewArrival}
              onChange={() => handleCheckboxChange('isNewArrival')}
            />
            <div className="checkbox-marker"></div>
            <label htmlFor="isNewArrival" className="checkbox-label">
              <FaTag className="metadata-icon" />
              <span>New Arrival</span>
            </label>
          </div>
        </div>

        <div className="metadata-item">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="isBestSeller"
              checked={metadata.isBestSeller}
              onChange={() => handleCheckboxChange('isBestSeller')}
            />
            <div className="checkbox-marker"></div>
            <label htmlFor="isBestSeller" className="checkbox-label">
              <FaStar className="metadata-icon" />
              <span>Best Seller</span>
            </label>
          </div>
        </div>

        <div className="metadata-item">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="isSale"
              checked={metadata.isSale}
              onChange={() => handleCheckboxChange('isSale')}
            />
            <div className="checkbox-marker"></div>
            <label htmlFor="isSale" className="checkbox-label">
              <FaFire className="metadata-icon" />
              <span>On Sale</span>
            </label>
          </div>
        </div>

        <div className="metadata-item">
          <div className="sale-percentage-container">
            <label htmlFor="salePercentage" className="percentage-label">
              <FaPercent className="metadata-icon" />
              <span>Discount</span>
            </label>
            <div className="percentage-input-wrapper">
              <input
                type="number"
                id="salePercentage"
                min="0"
                max="100"
                value={metadata.salePercentage || 0}
                onChange={(e) => handleNumberChange('salePercentage', e.target.value)}
                disabled={!metadata.isSale}
                className={errors?.salePercentage ? 'error' : ''}
              />
              <span className="percentage-symbol">%</span>
            </div>
            {errors?.salePercentage && (
              <p className="error-message">{errors.salePercentage}</p>
            )}
          </div>
        </div>
      </div>

      <div className="metadata-item display-page">
        <label htmlFor="displayPage" className="display-page-label">
          <FaTv className="metadata-icon" /> Featured Location
        </label>
        <div className="select-with-icon">
          <select
            id="displayPage"
            value={metadata.displayPage || ''}
            onChange={(e) => onChange({
              ...metadata,
              displayPage: e.target.value || null
            })}
            className={errors?.displayPage ? 'error' : ''}
          >
            <option value="">None</option>
            <option value="home">Home Page</option>
            <option value="featured">Featured Products</option>
            <option value="new-arrivals">New Arrivals</option>
            <option value="best-sellers">Best Sellers</option>
            <option value="promotions">Promotions</option>
          </select>
          <div className="select-icon">
            {getDisplayPageIcon(metadata.displayPage)}
          </div>
        </div>
        {errors?.displayPage && (
          <p className="error-message">{errors.displayPage}</p>
        )}
      </div>
    </div>
  );
};

export default ProductMetadataForm; 