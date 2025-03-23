import React from 'react';
import PropTypes from 'prop-types';
import './Loader.css';

/**
 * Loader component to display loading state
 * @param {Object} props Component props
 * @param {string} props.size - Size of the loader ('small', 'medium', 'large')
 * @param {string} props.color - Primary color of the loader
 * @param {string} props.text - Text to display below the loader
 * @param {boolean} props.fullScreen - Whether the loader should take up the full screen
 * @param {string} props.className - Additional CSS class
 */
const Loader = ({ 
  size = 'medium', 
  color = 'primary',
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const loaderClasses = [
    'loader',
    `loader--${size}`,
    `loader--${color}`,
    fullScreen ? 'loader--fullscreen' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClasses} data-testid="loader">
      <div className="loader__spinner">
        <div className="loader__spinner-inner"></div>
      </div>
      {text && <p className="loader__text">{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'dark', 'light']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string
};

export default Loader; 