import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

/**
 * Modal component for displaying dialog/popup content
 * @param {Object} props Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when modal should close
 * @param {React.ReactNode} props.children - Content to display in the modal
 * @param {string} props.title - Title for the modal header
 * @param {React.ReactNode} props.footer - Custom footer content
 * @param {string} props.size - Size of the modal (small, medium, large)
 * @param {boolean} props.closeOnEsc - Whether pressing Escape should close the modal
 * @param {boolean} props.closeOnOverlayClick - Whether clicking overlay should close modal
 * @param {string} props.className - Additional CSS class for styling
 */
const Modal = ({
  isOpen = false,
  onClose = () => {},
  children,
  title,
  footer,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  className = '',
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Handle body scrolling
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnEsc, isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Handle overlay click
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalClasses = [
    'modal',
    `modal--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} data-testid="modal-overlay">
      <div className={modalClasses} ref={modalRef} role="dialog" aria-modal="true">
        {/* Modal Header */}
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button
              type="button"
              className="modal__close"
              aria-label="Close modal"
              onClick={onClose}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal__body">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  closeOnEsc: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  className: PropTypes.string,
};

export default Modal; 