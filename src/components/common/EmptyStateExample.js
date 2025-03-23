import React from 'react';
import EmptyState from './EmptyState';

/**
 * Example component to demonstrate different ways to use the EmptyState component
 */
const EmptyStateExample = () => {
  // Button component for action
  const ActionButton = ({ text, onClick }) => (
    <button 
      onClick={onClick} 
      style={{ 
        padding: '8px 16px', 
        background: '#4a69bd', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {text}
    </button>
  );

  // Sample icon as an SVG
  const CartIcon = () => (
    <svg 
      width="64" 
      height="64" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#ccc" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  );

  return (
    <div className="empty-state-examples">
      <h2>EmptyState Component Examples</h2>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0' }}>
        <h3 style={{ padding: '0 20px' }}>Basic EmptyState</h3>
        <EmptyState 
          title="No products found" 
          message="We couldn't find any products matching your criteria." 
        />
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0' }}>
        <h3 style={{ padding: '0 20px' }}>EmptyState with Icon</h3>
        <EmptyState 
          title="Your cart is empty" 
          message="Add items to your cart to proceed to checkout." 
          icon={<CartIcon />}
        />
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0' }}>
        <h3 style={{ padding: '0 20px' }}>EmptyState with Action</h3>
        <EmptyState 
          title="No search results" 
          message="We couldn't find any results for your search. Try adjusting your search terms." 
          action={<ActionButton text="Clear Search" onClick={() => alert('Search cleared')} />}
        />
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0' }}>
        <h3 style={{ padding: '0 20px' }}>EmptyState with Image</h3>
        <EmptyState 
          title="No notifications" 
          message="You don't have any notifications at this time." 
          imageUrl="https://via.placeholder.com/150"
        />
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0' }}>
        <h3 style={{ padding: '0 20px' }}>Full EmptyState</h3>
        <EmptyState 
          title="Your wishlist is empty" 
          message="Start adding products to your wishlist to save them for later." 
          icon={<CartIcon />}
          action={<ActionButton text="Explore Products" onClick={() => alert('Navigate to products')} />}
        />
      </div>
    </div>
  );
};

export default EmptyStateExample; 