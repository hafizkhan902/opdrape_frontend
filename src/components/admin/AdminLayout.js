import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { 
  FaHome, 
  FaBoxOpen, 
  FaUsers, 
  FaCog,
  FaTags,
  FaChartLine,
  FaComments,
  FaStar,
  FaSignOutAlt,
  FaBars,
  FaUser
} from 'react-icons/fa';
import './AdminLayout.css';

/**
 * AdminLayout component that wraps all admin pages
 * Includes common elements like header and sidebar
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };
  
  const handleLogout = () => {
    // Clear auth token and user data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Get user from localStorage
  const getUserFromLocalStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return { name: 'Admin User', email: 'admin@example.com' };
  };

  const user = getUserFromLocalStorage();
  
  return (
    <div className="admin-layout">
      {/* New simplified admin header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <Link to="/admin" className="admin-brand">
            Opdrape Admin
          </Link>
        </div>
        
        <div className="admin-header-right">
          <div className="user-container">
            <button className="user-button" onClick={toggleUserDropdown}>
              <div className="user-avatar">
                <span>{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <span className="user-name">{user?.name || 'Admin User'}</span>
            </button>

            {userDropdownOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    <span>{user?.name?.charAt(0) || 'A'}</span>
                  </div>
                  <div className="user-dropdown-info">
                    <p className="user-dropdown-name">{user?.name || 'Admin User'}</p>
                    <p className="user-dropdown-email">{user?.email || 'admin@example.com'}</p>
                  </div>
                </div>
                <div className="user-dropdown-menu">
                  <Link to="/admin/profile" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <FaUser />
                    <span>Profile</span>
                  </Link>
                  <Link to="/admin/settings" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <FaCog />
                    <span>Settings</span>
                  </Link>
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className={`admin-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <NavLink to="/admin" end>
                  <FaHome />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/products">
                  <FaTags />
                  <span>Products</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders">
                  <FaBoxOpen />
                  <span>Orders</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/customers">
                  <FaUsers />
                  <span>Customers</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/reviews">
                  <FaStar />
                  <span>Reviews</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/messages">
                  <FaComments />
                  <span>Messages</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/analytics">
                  <FaChartLine />
                  <span>Analytics</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/settings">
                  <FaCog />
                  <span>Settings</span>
                </NavLink>
              </li>
              <li className="sidebar-divider"></li>
              <li>
                <Link to="/" className="back-to-store">
                  <span>Back to Store</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <main className={`admin-main ${!sidebarOpen ? 'expanded' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 