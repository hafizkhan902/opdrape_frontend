import React from 'react';
import PropTypes from 'prop-types';
import './ColorVariantSelector.css';

const ColorVariantSelector = ({ variants, selectedColor, onSelectColor }) => {
  // Extract unique colors from variants
  const uniqueColors = [...new Set(variants.map(variant => variant.color))];
  
  // Map color names to CSS color values
  const getColorValue = (colorName) => {
    const colorMap = {
      red: '#f44336',
      blue: '#2196f3',
      green: '#4caf50',
      yellow: '#ffeb3b',
      purple: '#9c27b0',
      pink: '#e91e63',
      orange: '#ff9800',
      brown: '#795548',
      black: '#000000',
      white: '#ffffff',
      gray: '#9e9e9e',
      navy: '#000080',
      teal: '#008080',
      olive: '#808000',
      maroon: '#800000',
      lime: '#00ff00',
      aqua: '#00ffff',
      fuchsia: '#ff00ff',
      silver: '#c0c0c0',
    };
    
    // If color name is in our map, use the mapped value
    if (colorMap[colorName.toLowerCase()]) {
      return colorMap[colorName.toLowerCase()];
    }
    
    // Otherwise, just return the color name (it might be a valid CSS color)
    return colorName.toLowerCase();
  };
  
  // Check if a color is available (has in-stock variants)
  const isColorAvailable = (color) => {
    const colorVariant = variants.find(v => v.color === color);
    
    // Check if the color variant exists and has stock
    if (!colorVariant) return false;
    
    // If the variant has a stock property directly, check it
    if (typeof colorVariant.stock === 'number') {
      return colorVariant.stock > 0;
    }
    
    // Otherwise, check if any of the sizes have stock
    if (colorVariant.sizes && colorVariant.sizes.length > 0) {
      return colorVariant.sizes.some(size => size.stock > 0);
    }
    
    return false;
  };

  return (
    <div className="color-variant-selector">
      {uniqueColors.map(color => (
        <button
          key={color}
          className={`color-option ${selectedColor === color ? 'active' : ''} ${
            !isColorAvailable(color) ? 'out-of-stock' : ''
          }`}
          style={{ backgroundColor: getColorValue(color) }}
          onClick={() => onSelectColor(color)}
          disabled={!isColorAvailable(color)}
          aria-label={`${color}${!isColorAvailable(color) ? ' (Out of Stock)' : ''}`}
          title={`${color}${!isColorAvailable(color) ? ' (Out of Stock)' : ''}`}
        />
      ))}
    </div>
  );
};

ColorVariantSelector.propTypes = {
  variants: PropTypes.arrayOf(
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
  onSelectColor: PropTypes.func.isRequired,
};

export default ColorVariantSelector; 