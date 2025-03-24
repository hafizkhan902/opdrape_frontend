import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAdminProducts, getAdminOrders, getUserProfile, getAdminUsers } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAppContext();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch products count
        const productsResponse = await getAdminProducts();
        let totalProducts = 0;
        
        // Handle different response formats
        if (productsResponse?.data) {
          if (Array.isArray(productsResponse.data)) {
            totalProducts = productsResponse.data.length;
          } else if (productsResponse.data.products && Array.isArray(productsResponse.data.products)) {
            totalProducts = productsResponse.data.products.length;
          } else if (productsResponse.data.total) {
            totalProducts = productsResponse.data.total;
          }
        }
        
        // Fetch orders data
        const ordersResponse = await getAdminOrders();
        let totalOrders = 0;
        let recentOrders = [];
        
        // Handle different response formats
        if (ordersResponse?.data) {
          if (Array.isArray(ordersResponse.data)) {
            totalOrders = ordersResponse.data.length;
            recentOrders = ordersResponse.data
              .slice(0, 5)
              .map(order => ({
                id: order._id || order.id || order.orderId || 'Unknown',
                customer: order.user?.name || order.userName || 'Customer',
                amount: order.total || order.totalAmount || 0,
                status: order.status || 'Processing'
              }));
          } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
            totalOrders = ordersResponse.data.orders.length;
            recentOrders = ordersResponse.data.orders
              .slice(0, 5)
              .map(order => ({
                id: order._id || order.id || order.orderId || 'Unknown',
                customer: order.user?.name || order.userName || 'Customer',
                amount: order.total || order.totalAmount || 0,
                status: order.status || 'Processing'
              }));
          } else if (ordersResponse.data.total) {
            totalOrders = ordersResponse.data.total;
          }
        }
        
        // Fetch customers count using the admin users API
        let totalCustomers = 0;
        try {
          const usersResponse = await getAdminUsers();
          if (usersResponse?.data) {
            if (Array.isArray(usersResponse.data)) {
              totalCustomers = usersResponse.data.length;
            } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
              totalCustomers = usersResponse.data.users.length;
            } else if (usersResponse.data.total) {
              totalCustomers = usersResponse.data.total;
            }
          }
          console.log('Real customer count fetched:', totalCustomers);
        } catch (err) {
          console.error('Error fetching customers count:', err);
          // If the API call fails, we'll try to calculate from orders as fallback
          if (Array.isArray(ordersResponse?.data) || Array.isArray(ordersResponse?.data?.orders)) {
            const ordersList = Array.isArray(ordersResponse.data) 
              ? ordersResponse.data 
              : (ordersResponse.data.orders || []);
              
            const uniqueCustomerIds = new Set();
            
            ordersList.forEach(order => {
              const customerId = order.user?._id || order.userId || order.user;
              if (customerId) {
                uniqueCustomerIds.add(customerId);
              }
            });
            
            if (uniqueCustomerIds.size > 0) {
              totalCustomers = uniqueCustomerIds.size;
              console.log('Fallback customer count calculated from orders:', totalCustomers);
            }
          }
        }
        
        // Update the stats with real data
        setStats({
          totalProducts,
          totalOrders,
          totalCustomers,
          recentOrders
        });
        
        console.log('Dashboard data loaded with real counts:', {
          products: totalProducts,
          orders: totalOrders,
          customers: totalCustomers
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // If API calls fail, we'll keep the initial zero values
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="user-status">
          Logged in as: <strong>{user?.name || 'Unknown User'}</strong> 
          <span className="admin-badge">Administrator</span>
        </p>
      </div>
      
      <div className="admin-stats-container">
        <div className="admin-stat-card">
          <h3>Products</h3>
          {loading ? (
            <p className="stat-loading">Loading...</p>
          ) : (
            <p className="stat-number">{stats.totalProducts}</p>
          )}
          <a href="/admin/products" className="stat-link">View all products</a>
        </div>
        
        <div className="admin-stat-card">
          <h3>Orders</h3>
          {loading ? (
            <p className="stat-loading">Loading...</p>
          ) : (
            <p className="stat-number">{stats.totalOrders}</p>
          )}
          <a href="/admin/orders" className="stat-link">View all orders</a>
        </div>
        
        <div className="admin-stat-card">
          <h3>Customers</h3>
          {loading ? (
            <p className="stat-loading">Loading...</p>
          ) : (
            <p className="stat-number">{stats.totalCustomers}</p>
          )}
          <a href="/admin/customers" className="stat-link">View all customers</a>
        </div>
      </div>
      
      <div className="recent-orders-section">
        <h2>Recent Orders</h2>
        <div className="recent-orders-table-container">
          {loading ? (
            <div className="loading-indicator">Loading recent orders...</div>
          ) : stats.recentOrders.length > 0 ? (
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>${(order.amount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${(order.status || 'processing').toLowerCase()}`}>
                        {order.status || 'Processing'}
                      </span>
                    </td>
                    <td>
                      <a href={`/admin/orders/${order.id}`} className="view-button">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-orders-message">No recent orders found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 