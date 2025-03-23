import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

/**
 * Breadcrumbs component for displaying navigation hierarchy
 * @param {Object} props Component props
 * @param {Array} props.items - Array of breadcrumb items
 * @param {string} props.separator - Character or element to separate breadcrumb items
 * @param {string} props.className - Additional CSS class
 */
const Breadcrumbs = ({
  items = [],
  separator = '/',
  className = '',
}) => {
  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  const breadcrumbsClasses = ['breadcrumbs', className].filter(Boolean).join(' ');

  return (
    <nav aria-label="Breadcrumb" className={breadcrumbsClasses}>
      <ol className="breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={`breadcrumb-${index}`} 
              className={`breadcrumbs__item ${isLast ? 'breadcrumbs__item--active' : ''}`}
            >
              {isLast ? (
                <span className="breadcrumbs__text" aria-current="page">
                  {item.label}
                </span>
              ) : item.path ? (
                <>
                  <Link to={item.path} className="breadcrumbs__link">
                    {item.label}
                  </Link>
                  <span className="breadcrumbs__separator" aria-hidden="true">
                    {separator}
                  </span>
                </>
              ) : (
                <>
                  <span className="breadcrumbs__text">{item.label}</span>
                  <span className="breadcrumbs__separator" aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ).isRequired,
  separator: PropTypes.node,
  className: PropTypes.string,
};

export default Breadcrumbs; 