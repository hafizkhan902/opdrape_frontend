import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFacebookF, 
  faTwitter, 
  faInstagram, 
  faPinterestP 
} from '@fortawesome/free-brands-svg-icons';
import { 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
  faAngleRight 
} from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // This would normally call an API endpoint to submit the email
    // Since this isn't connected to a real API, just show an alert
    alert('Thank you for subscribing to our newsletter!');
    e.target.reset();
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Company Info */}
          <div className="footer-section">
            <h3 className="footer-title">StyleShop</h3>
            <p className="footer-description">
              Your destination for trendy and affordable fashion. We offer the latest styles
              for men, women, and children at prices you'll love.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <FontAwesomeIcon icon={faPinterestP} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/">Home</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/products">Shop</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/blog">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-section">
            <h3 className="footer-title">My Account</h3>
            <ul className="footer-links">
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/login">Login</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/register">Register</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/account">My Profile</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/orders">My Orders</Link>
              </li>
              <li>
                <FontAwesomeIcon icon={faAngleRight} className="footer-icon" />
                <Link to="/wishlist">Wishlist</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="footer-icon" />
                <span>123 Fashion St, Style City, SC 12345</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faPhone} className="footer-icon" />
                <span>(123) 456-7890</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faEnvelope} className="footer-icon" />
                <span>support@styleshop.com</span>
              </li>
            </ul>

            <h3 className="footer-title">Newsletter</h3>
            <p className="footer-description">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form className="footer-newsletter" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Your email address" 
                required
                aria-label="Email address for newsletter"
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} StyleShop. All rights reserved.</p>
          </div>
          <div className="footer-policy-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>
          <div className="footer-payment">
            <img src="/images/payment-methods.png" alt="Accepted payment methods" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 