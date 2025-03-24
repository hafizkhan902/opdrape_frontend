import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, deleteUser, getUserOrdersById } from '../../../services/api';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './CustomerList.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name?.toLowerCase().includes(lowercasedTerm) ||
        customer.email?.toLowerCase().includes(lowercasedTerm) ||
        customer.phone?.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredCustomers(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      
      // Handle different response formats
      let usersList = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          usersList = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersList = response.data.users;
        }
      }
      
      // Fetch order counts for each user
      const usersWithOrderCount = await Promise.all(
        usersList.map(async (user) => {
          const userId = user.id || user._id;
          try {
            // Get user orders
            const ordersResponse = await getUserOrdersById(userId);
            let orderCount = 0;
            
            // Extract order count from response
            if (ordersResponse?.data) {
              if (Array.isArray(ordersResponse.data)) {
                orderCount = ordersResponse.data.length;
              } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
                orderCount = ordersResponse.data.orders.length;
              } else if (ordersResponse.data.count) {
                orderCount = ordersResponse.data.count;
              }
            }
            
            return {
              ...user,
              orderCount
            };
          } catch (error) {
            console.error(`Error fetching orders for user ${userId}:`, error);
            // Return the user without order count if there's an error
            return user;
          }
        })
      );
      
      // Apply default sorting
      const sortedUsers = sortData(usersWithOrderCount, sortConfig.key, sortConfig.direction);
      
      setCustomers(sortedUsers);
      setFilteredCustomers(sortedUsers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sorted = sortData([...filteredCustomers], key, direction);
    setFilteredCustomers(sorted);
  };

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      // Handle null or undefined values
      if (a[key] == null) return direction === 'asc' ? -1 : 1;
      if (b[key] == null) return direction === 'asc' ? 1 : -1;
      
      // Handle different data types
      if (typeof a[key] === 'string') {
        return direction === 'asc' 
          ? a[key].localeCompare(b[key])
          : b[key].localeCompare(a[key]);
      }
      
      // For dates
      if (key === 'createdAt' || key === 'lastLogin') {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // For numbers
      return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
    });
  };

  const confirmDelete = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    setDeleteLoading(true);
    try {
      await deleteUser(selectedCustomer.id || selectedCustomer._id);
      
      // Update the lists after successful deletion
      const updatedCustomers = customers.filter(c => 
        (c.id || c._id) !== (selectedCustomer.id || selectedCustomer._id)
      );
      setCustomers(updatedCustomers);
      setFilteredCustomers(
        filteredCustomers.filter(c => 
          (c.id || c._id) !== (selectedCustomer.id || selectedCustomer._id)
        )
      );
      
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort />;
    }
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading-container">Loading customers...</div>;
  }

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Customers</h1>
        <Link to="/admin/customers/add" className="add-customer-btn">
          <FaPlus /> Add Customer
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="customers-actions">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="customers-count">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
        </div>
      </div>

      {filteredCustomers.length > 0 ? (
        <>
          <div className="customers-table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    <span className="sort-header">
                      Name {getSortIcon('name')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('email')}>
                    <span className="sort-header">
                      Email {getSortIcon('email')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('createdAt')}>
                    <span className="sort-header">
                      Registered On {getSortIcon('createdAt')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('orderCount')}>
                    <span className="sort-header">
                      Orders {getSortIcon('orderCount')}
                    </span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((customer) => (
                  <tr key={customer.id || customer._id}>
                    <td>
                      <Link to={`/admin/customers/${customer.id || customer._id}`} className="customer-name-link">
                        {customer.name || 'N/A'}
                      </Link>
                    </td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>{customer.orderCount || customer.orders?.length || 0}</td>
                    <td className="actions-cell">
                      <Link 
                        to={`/admin/customers/${customer.id || customer._id}`} 
                        className="action-button view-button"
                        title="View Customer Details"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/admin/customers/${customer.id || customer._id}/edit`} 
                        className="action-button edit-button"
                        title="Edit Customer"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="action-button delete-button"
                        onClick={() => confirmDelete(customer)}
                        title="Delete Customer"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="page-button"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`page-button ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="page-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-customers">
          <p>No customers found. {searchTerm ? 'Try a different search term.' : ''}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete customer: <strong>{selectedCustomer?.name || selectedCustomer?.email || 'Unknown'}</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-button"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList; 