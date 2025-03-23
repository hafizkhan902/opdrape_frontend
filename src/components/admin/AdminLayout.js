import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaBoxOpen, 
  FaUsers, 
  FaCog,
  FaTags,
  FaChartLine
} from 'react-icons/fa';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

/**
 * AdminLayout component that wraps all admin pages
 * Includes common elements like header and sidebar
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="admin-layout">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="admin-content">
        <div className={`admin-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-logo">
            <h2>Opdrape Admin</h2>
          </div>
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