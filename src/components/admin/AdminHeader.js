import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { getUserProfile } from '../../services/api';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await getUserProfile();
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Try to get user from localStorage as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleUserDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  const handleLogout = () => {
    // Clear auth token and user data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="admin-brand">
          <Link to="/admin">Admin Dashboard</Link>
        </div>
      </div>

      <div className="admin-header-right">
        <div className="notification-container">
          <button className="notification-button" onClick={toggleNotifications}>
            <FaBell />
            <span className="notification-badge">3</span>
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                <button className="mark-all-read">Mark all as read</button>
              </div>
              <div className="notification-list">
                <div className="notification-item unread">
                  <div className="notification-content">
                    <p className="notification-text">New order #12345 received</p>
                    <span className="notification-time">5 minutes ago</span>
                  </div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-content">
                    <p className="notification-text">Stock alert: Product "Example Product" is low on stock</p>
                    <span className="notification-time">1 hour ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-content">
                    <p className="notification-text">New user registered</p>
                    <span className="notification-time">Yesterday</span>
                  </div>
                </div>
              </div>
              <div className="notification-footer">
                <Link to="/admin/notifications" onClick={() => setNotificationsOpen(false)}>
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="user-container">
          <button className="user-button" onClick={toggleUserDropdown}>
            <div className="user-avatar">
              {!loading && user?.name ? (
                <span>{user.name.charAt(0)}</span>
              ) : (
                <FaUser />
              )}
            </div>
            <span className="user-name">
              {loading ? 'Loading...' : user?.name || 'Admin User'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                  {user?.name ? <span>{user.name.charAt(0)}</span> : <FaUser />}
                </div>
                <div className="user-dropdown-info">
                  <p className="user-dropdown-name">{user?.name || 'Admin User'}</p>
                  <p className="user-dropdown-email">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>
              <div className="user-dropdown-menu">
                <Link to="/admin/profile" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <FaUser />
                  <span>Profile</span>
                </Link>
                <Link to="/admin/settings" className="user-dropdown-item" onClick={() => setDropdownOpen(false)}>
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
  );
};

export default AdminHeader; 