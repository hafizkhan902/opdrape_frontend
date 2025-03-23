import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingCart, 
  faHeart, 
  faSearch, 
  faBars, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { getProductCategories } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import CartPopup from '../shopping/CartPopup';
import Button from '../common/Button';
import './Navbar.css';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { isAuthenticated, user, cart, wishlist, logout } = useAppContext();
  const navigate = useNavigate();
  
  // Calculate wishlist length
  const wishlistCount = wishlist?.length || 0;

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getProductCategories();
        setCategories(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" className="logo">
              StyleShop
            </Link>
            
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu} 
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>

          <nav className={`navbar-menu ${isMobileMenuOpen ? 'is-active' : ''}`}>
            <div className="navbar-categories">
              {!isLoading && categories.map((category) => (
                <Link 
                  key={category.id || category.name} 
                  to={`/categories/${category.slug || category.name.toLowerCase()}`} 
                  className="navbar-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <form className="navbar-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" aria-label="Search">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </form>

            <div className="navbar-actions">
              <Link to="/wishlist" className="navbar-icon" aria-label="Wishlist">
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
                <div className="navbar-user-menu">
                  <button className="user-menu-toggle">
                    <FontAwesomeIcon icon={faUser} />
                    <span className="user-name">{user?.firstName || 'My Account'}</span>
                  </button>
                  <div className="user-dropdown">
                    <Link to="/account" className="dropdown-item">My Account</Link>
                    <Link to="/orders" className="dropdown-item">Orders</Link>
                    <button onClick={logout} className="dropdown-item">Logout</button>
                  </div>
                </div>
              ) : (
                <div className="navbar-auth">
                  <Link to="/login">
                    <Button variant="text" size="small">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="small">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      
      {/* Cart Popup */}
      <CartPopup isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar; 