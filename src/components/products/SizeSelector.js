import React from 'react';
import PropTypes from 'prop-types';
import './SizeSelector.css';

const SizeSelector = ({ colorVariants, selectedColor, selectedSize, onSelectSize }) => {
  // Get the selected color variant
  const selectedColorVariant = selectedColor ? 
    colorVariants.find(variant => variant.color === selectedColor) : null;
  
  // Get available sizes for the selected color
  const availableSizes = selectedColorVariant && selectedColorVariant.sizes ? 
    selectedColorVariant.sizes.map(sizeObj => sizeObj.size) : [];
  
  // Check if a size is available (in stock) for the selected color
  const isSizeAvailable = (size) => {
    if (!selectedColorVariant || !selectedColorVariant.sizes) return false;
    
    const sizeObj = selectedColorVariant.sizes.find(s => s.size === size);
    return sizeObj ? sizeObj.stock > 0 : false;
  };

  // Sort sizes in a logical order
  const sortSizes = (sizes) => {
    // Common size ordering for clothing
    const sizeOrder = {
      'XS': 1, 
      'S': 2, 
      'M': 3, 
      'L': 4, 
      'XL': 5, 
      'XXL': 6, 
      '2XL': 6,
      'XXXL': 7,
      '3XL': 7
    };
    
    return [...sizes].sort((a, b) => {
      // If both sizes are standard sizes, use the order map
      if (sizeOrder[a] && sizeOrder[b]) {
        return sizeOrder[a] - sizeOrder[b];
      }
      
      // If both are numeric, sort numerically
      if (!isNaN(a) && !isNaN(b)) {
        return Number(a) - Number(b);
      }
      
      // Otherwise, use string comparison
      return a.localeCompare(b);
    });
  };

  // If no color is selected or no sizes are available, show empty or disabled state
  if (!selectedColor || availableSizes.length === 0) {
    return (
      <div className="size-selector empty">
        <p className="no-sizes">
          {!selectedColor 
            ? 'Please select a color first' 
            : 'No sizes available for this color'}
        </p>
      </div>
    );
  }

  const sortedSizes = sortSizes(availableSizes);

  return (
    <div className="size-selector">
      {sortedSizes.map(size => (
        <button
          key={size}
          className={`size-option ${selectedSize === size ? 'active' : ''} ${
            !isSizeAvailable(size) ? 'out-of-stock' : ''
          }`}
          onClick={() => onSelectSize(size)}
          disabled={!isSizeAvailable(size)}
          aria-label={`Size ${size}${!isSizeAvailable(size) ? ' (Out of Stock)' : ''}`}
          title={`Size ${size}${!isSizeAvailable(size) ? ' (Out of Stock)' : ''}`}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

SizeSelector.propTypes = {
  colorVariants: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string.isRequired,
      stock: PropTypes.number,
      sizes: PropTypes.arrayOf(
        PropTypes.shape({
          size: PropTypes.string.isRequired,
          stock: PropTypes.number.isRequired,
        })
      )
    })
  ).isRequired,
  selectedColor: PropTypes.string,
  selectedSize: PropTypes.string,
  onSelectSize: PropTypes.func.isRequired,
};

export default SizeSelector; 