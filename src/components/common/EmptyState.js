import React from 'react';
import PropTypes from 'prop-types';
import './EmptyState.css';

/**
 * EmptyState component to display when there is no content
 * @param {Object} props Component props
 * @param {string} props.title - Main title for the empty state
 * @param {string} props.message - Descriptive message explaining why content is empty
 * @param {React.ReactNode} props.icon - Custom icon element to display
 * @param {React.ReactNode} props.action - Action element (usually a button)
 * @param {string} props.imageUrl - URL to an image to display
 * @param {string} props.className - Additional CSS class names
 */
const EmptyState = ({
  title = 'No items found',
  message = 'There are no items to display at this time.',
  icon,
  action,
  imageUrl,
  className = '',
}) => {
  const emptyStateClasses = ['empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={emptyStateClasses} data-testid="empty-state">
      <div className="empty-state__content">
        {imageUrl && (
          <div className="empty-state__image-container">
            <img 
              src={imageUrl} 
              alt={title} 
              className="empty-state__image" 
            />
          </div>
        )}
        
        {icon && <div className="empty-state__icon">{icon}</div>}
        
        <h3 className="empty-state__title">{title}</h3>
        
        {message && <p className="empty-state__message">{message}</p>}
        
        {action && <div className="empty-state__action">{action}</div>}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
  imageUrl: PropTypes.string,
  className: PropTypes.string,
};

export default EmptyState;
