import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingCart, 
  faHeart, 
  faSearch, 
  faBars, 
  faTimes,
  faSignOutAlt,
  faLock,
  faTachometerAlt
} from '@fortawesome/free-solid-svg-icons';
import { getProductCategories } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import CartPopup from '../shopping/CartPopup';
import logo from '../../assets/images/logo.png';
import './Navbar.css';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const { isAuthenticated, user, cart, wishlist, logout } = useAppContext();
  const navigate = useNavigate();
  
  // Check if user has admin role
  const isAdmin = user?.isAdmin === true || user?.role === 'admin';
  
  // Add console log to debug user data
  useEffect(() => {
    console.log('Current user object:', user);
  }, [user]);
  
  // Calculate wishlist length
  const wishlistCount = wishlist?.length || 0;

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getProductCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Toggle user dropdown menu
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    // Close search if open
    if (isSearchOpen) setIsSearchOpen(false);
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isUserMenuOpen && !event.target.closest('.navbar-user-menu')) {
        setIsUserMenuOpen(false);
      }
      if (isSearchOpen && !event.target.closest('.search-container') && !event.target.closest('.search-toggle')) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isSearchOpen]);

  // Focus input when search box opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Handle mobile menu toggle with animation
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close other menus
    if (isSearchOpen) setIsSearchOpen(false);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  // Handle menu item click with animation
  const handleMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    // Close search if open
    if (isSearchOpen) setIsSearchOpen(false);
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    // Close other menus
    if (isUserMenuOpen) setIsUserMenuOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" className="logo">
              <img src={logo} alt="OpDrape Logo" className="logo-image" />
            </Link>
            
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu} 
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>

          <nav className={`navbar-menu ${isMobileMenuOpen ? 'is-active' : ''} ${isLoading ? 'loading' : ''}`}>
            <div className="navbar-categories">
              {!isLoading && categories.map((category) => (
                <Link 
                  key={category.id || category.name} 
                  to={`/products/category/${category.slug || category.name.toLowerCase()}`} 
                  className="navbar-item"
                  onClick={handleMenuItemClick}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="navbar-actions">
              <button 
                className="navbar-icon search-toggle" 
                onClick={toggleSearch}
                aria-label="Toggle search"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>

              <Link to="/wishlist" className="navbar-icon" aria-label="Wishlist" onClick={handleMenuItemClick}>
                <FontAwesomeIcon icon={faHeart} />
                {wishlistCount > 0 && (
                  <span className="wishlist-count">{wishlistCount}</span>
                )}
              </Link>

              <button
                className="navbar-icon cart-icon"
                aria-label="Shopping cart"
                onClick={toggleCart}
              >
                <FontAwesomeIcon icon={faShoppingCart} />
                {cart.totalItems > 0 && (
                  <span className="cart-count">{cart.totalItems}</span>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <div className="navbar-user-menu">
                      <Link to="/admin" className="dashboard-btn" onClick={handleMenuItemClick}>
                        <FontAwesomeIcon icon={faTachometerAlt} className="dashboard-icon" />
                        <span className="dashboard-text">Dashboard</span>
                      </Link>
                      <div className={`user-dropdown ${isUserMenuOpen ? 'is-active' : ''}`}>
                        <div className="user-dropdown-header">
                          <div className="user-avatar">
                            <span>{user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}</span>
                          </div>
                          <div className="user-info">
                            <p className="user-fullname">{`${user?.firstName || ''} ${user?.lastName || ''}`}</p>
                            <p className="user-email">{user?.email || ''}</p>
                          </div>
                        </div>
                        <div className="dropdown-menu">
                          <Link to="/account/change-password" className="dropdown-item" onClick={handleMenuItemClick}>
                            <FontAwesomeIcon icon={faLock} className="dropdown-icon" />
                            <span>Change Password</span>
                          </Link>
                          <button 
                            onClick={() => {
                              handleMenuItemClick();
                              logout();
                            }} 
                            className="dropdown-item logout-item"
                          >
                            <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="navbar-user-menu">
                      <button 
                        className="user-menu-toggle" 
                        onClick={toggleUserMenu}
                        aria-expanded={isUserMenuOpen}
                      >
                        <FontAwesomeIcon icon={faUser} />
                      </button>
                      <div className={`user-dropdown ${isUserMenuOpen ? 'is-active' : ''}`}>
                        <div className="user-dropdown-header">
                          <div className="user-avatar">
                            <span>{user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}</span>
                          </div>
                          <div className="user-info">
                            <p className="user-fullname">{`${user?.firstName || ''} ${user?.lastName || ''}`}</p>
                            <p className="user-email">{user?.email || ''}</p>
                          </div>
                        </div>
                        <div className="dropdown-menu">
                          <Link to="/account" className="dropdown-item" onClick={handleMenuItemClick}>
                            <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                            <span>My Account</span>
                          </Link>
                          <Link to="/orders" className="dropdown-item" onClick={handleMenuItemClick}>
                            <FontAwesomeIcon icon={faShoppingCart} className="dropdown-icon" />
                            <span>My Orders</span>
                          </Link>
                          <Link to="/account/change-password" className="dropdown-item" onClick={handleMenuItemClick}>
                            <FontAwesomeIcon icon={faLock} className="dropdown-icon" />
                            <span>Change Password</span>
                          </Link>
                          <button 
                            onClick={() => {
                              handleMenuItemClick();
                              logout();
                            }} 
                            className="dropdown-item logout-item"
                          >
                            <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="navbar-auth">
                  <Link to="/login" className="btn btn-login" onClick={handleMenuItemClick}>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-register" onClick={handleMenuItemClick}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
          
          {/* Search overlay */}
          <div className={`search-overlay ${isSearchOpen ? 'is-active' : ''}`}>
            <div className="search-container">
              <form className="navbar-search" onSubmit={handleSearch}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
                <button 
                  type="button" 
                  className="search-close" 
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Close search"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <button type="submit" aria-label="Search">
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      
      {/* Cart Popup */}
      <CartPopup isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar; 