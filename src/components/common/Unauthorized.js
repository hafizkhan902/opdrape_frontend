import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

/**
 * Unauthorized component displayed when users attempt to access restricted areas
 */
const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this area.</p>
        <p>This section requires administrator privileges.</p>
        <div className="unauthorized-actions">
          <Link to="/" className="btn-primary">Return to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 