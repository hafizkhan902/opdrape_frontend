import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CustomerList from '../../components/admin/customers/CustomerList';
import CustomerDetail from '../../components/admin/customers/CustomerDetail';
import CustomerEdit from '../../components/admin/customers/CustomerEdit';
import './AdminCustomersPage.css';

const AdminCustomersPage = () => {
  const params = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  
  // Debug info
  console.log('AdminCustomersPage - Current path:', location.pathname);
  console.log('AdminCustomersPage - Path parts:', pathParts);
  console.log('AdminCustomersPage - Params:', params);
  
  // Determine which component to render based on the URL
  const renderComponent = () => {
    // If we're at /admin/customers/ID/edit - show edit form
    if (pathParts.length >= 5 && pathParts[4] === 'edit') {
      return <CustomerEdit />;
    }
    
    // If we're at /admin/customers/ID - show customer details
    if (pathParts.length >= 4 && pathParts[3] && pathParts[3].length > 0) {
      return <CustomerDetail />;
    }
    
    // Default: show customer list at /admin/customers
    return <CustomerList />;
  };

  return (
    <div className="admin-customers-container">
      {renderComponent()}
    </div>
  );
};

export default AdminCustomersPage; 