import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * A reusable button component with different variants and sizes
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].join(' ').trim();

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button; 