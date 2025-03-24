import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './components/layout/HomePage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProductList from './components/admin/AdminProductList';
import AdminProductForm from './components/admin/AdminProductForm';
import AdminOrderList from './components/admin/AdminOrderList';
import AdminOrderDetail from './components/admin/AdminOrderDetail';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import UserProfile from './components/user/UserProfile';
import ProductGrid from './components/products/ProductGrid';
import ProductDetail from './components/products/ProductDetail';
import BannerProductsPage from './components/products/BannerProductsPage';
import ShoppingCart from './components/shopping/ShoppingCart';
import Checkout from './components/shopping/Checkout';
import OrderHistory from './components/shopping/OrderHistory';
import OrderConfirmation from './components/shopping/OrderConfirmation';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';
import ProtectedRoute from './components/common/ProtectedRoute';
import Unauthorized from './components/common/Unauthorized';
import { detectBrowser } from './utils/browserDetect';
import ChangePassword from './components/user/ChangePassword';
import './App.css';

function App() {
  const [browserWarning, setBrowserWarning] = useState(null);
  
  useEffect(() => {
    // Check for browser compatibility issues
    const { browser, version } = detectBrowser();
    
    // Display warning for older browsers
    if ((browser === 'chrome' && version < 70) || 
        (browser === 'firefox' && version < 68) ||
        (browser === 'safari' && version < 12) ||
        browser === 'ie') {
      setBrowserWarning(`You are using an older version of ${browser} (${version}). Some features may not work correctly. We recommend updating your browser for the best experience.`);
    }
    
    // Clean up any global listeners or polyfills if needed
    return () => {
      // Cleanup code if needed
    };
  }, []);
  
  return (
    <ErrorBoundary>
      {browserWarning && (
        <div className="browser-warning">
          <p>{browserWarning}</p>
          <button onClick={() => setBrowserWarning(null)}>Dismiss</button>
        </div>
      )}
      <AppProvider>
        <Router>
          <Routes>
            {/* Admin Routes */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProductList />} />
                <Route path="products/add" element={<AdminProductForm />} />
                <Route path="products/edit/:id" element={<AdminProductForm />} />
                <Route path="products/categories" element={<div>Product Categories</div>} />
                <Route path="products/inventory" element={<div>Inventory Management</div>} />
                <Route path="orders" element={<AdminOrderList />} />
                <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="customers/:id" element={<AdminCustomersPage />} />
                <Route path="customers/:id/edit" element={<AdminCustomersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="reviews/:reviewId" element={<AdminReviewsPage />} />
                <Route path="messages" element={<div>Customer Messages</div>} />
                <Route path="analytics" element={<div>Analytics Dashboard</div>} />
                <Route path="settings/*" element={<div>Admin Settings</div>} />
              </Route>
            </Route>

            {/* Customer-facing Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={
                <ErrorBoundary>
                  <HomePage />
                </ErrorBoundary>
              } />
              <Route path="/login" element={
                <ErrorBoundary>
                  <LoginForm />
                </ErrorBoundary>
              } />
              <Route path="/register" element={
                <ErrorBoundary>
                  <RegisterForm />
                </ErrorBoundary>
              } />
              <Route path="/forgot-password" element={
                <ErrorBoundary>
                  <ForgotPasswordForm />
                </ErrorBoundary>
              } />
              <Route path="/account" element={
                <ErrorBoundary>
                  <UserProfile />
                </ErrorBoundary>
              } />
              <Route path="/account/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/product/:productId" element={
                <ErrorBoundary>
                  <ProductDetail />
                </ErrorBoundary>
              } />
              <Route path="/products/category/:category" element={
                <ErrorBoundary>
                  <ProductGrid 
                    title="Category Products" 
                  />
                </ErrorBoundary>
              } />
              <Route path="/banner/:category" element={
                <ErrorBoundary>
                  <BannerProductsPage />
                </ErrorBoundary>
              } />
              <Route path="/cart" element={
                <ErrorBoundary>
                  <ShoppingCart />
                </ErrorBoundary>
              } />
              <Route path="/checkout" element={
                <ErrorBoundary>
                  <Checkout />
                </ErrorBoundary>
              } />
              <Route path="/order/confirmation/:orderId" element={
                <ErrorBoundary>
                  <OrderConfirmation />
                </ErrorBoundary>
              } />
              <Route path="/order/:orderId" element={
                <ErrorBoundary>
                  <OrderConfirmation />
                </ErrorBoundary>
              } />
              <Route path="/orders" element={
                <ErrorBoundary>
                  <OrderHistory />
                </ErrorBoundary>
              } />
              <Route path="/wishlist" element={
                <ErrorBoundary>
                  <div>Wishlist Page (Coming Soon)</div>
                </ErrorBoundary>
              } />
              <Route path="/search" element={
                <ErrorBoundary>
                  <ProductGrid 
                    title="Search Results" 
                    searchQuery="test-query" // This would normally come from URL query params
                  />
                </ErrorBoundary>
              } />
              <Route path="/unauthorized" element={
                <ErrorBoundary>
                  <Unauthorized />
                </ErrorBoundary>
              } />
              <Route path="*" element={
                <ErrorBoundary>
                  <div>404 - Page Not Found</div>
                </ErrorBoundary>
              } />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App; 