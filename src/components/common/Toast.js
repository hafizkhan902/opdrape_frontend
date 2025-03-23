import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

/**
 * Toast component for displaying notifications
 * @param {Object} props Component props
 * @param {string} props.message - Message to display in the toast
 * @param {string} props.type - Type of toast (success, error, warning, info)
 * @param {number} props.duration - Duration in ms to show the toast
 * @param {function} props.onClose - Callback when toast is closed
 * @param {boolean} props.isVisible - Whether the toast is visible
 * @param {boolean} props.hasCloseButton - Whether to show a close button
 * @param {React.ReactNode} props.icon - Custom icon for the toast
 * @param {string} props.position - Position of the toast on screen
 */
const Toast = ({
  message = '',
  type = 'info',
  duration = 3000,
  onClose = () => {},
  isVisible = true,
  hasCloseButton = true,
  icon,
  position = 'bottom-center',
}) => {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  // Default icons for different toast types
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  const toastClasses = [
    'toast',
    `toast--${type}`,
    `toast--${position}`,
    visible ? 'toast--visible' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={toastClasses} role="alert">
      <div className="toast__icon">
        {icon || getDefaultIcon()}
      </div>

      <div className="toast__content">
        {message}
      </div>

      {hasCloseButton && (
        <button
          type="button"
          className="toast__close"
          aria-label="Close notification"
          onClick={handleClose}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  isVisible: PropTypes.bool,
  hasCloseButton: PropTypes.bool,
  icon: PropTypes.node,
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]),
};

export default Toast; 