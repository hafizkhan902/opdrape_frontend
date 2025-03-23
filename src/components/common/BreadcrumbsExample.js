import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

/**
 * Example component to demonstrate the Breadcrumbs component
 */
const BreadcrumbsExample = () => {
  // Sample breadcrumb data
  const homeOnlyBreadcrumbs = [
    { label: 'Home', path: '/' }
  ];

  const categoryBreadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Clothing' }
  ];

  const productBreadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Clothing', path: '/products/clothing' },
    { label: 'T-Shirts', path: '/products/clothing/t-shirts' },
    { label: 'Blue Summer T-Shirt' }
  ];

  // Custom SVG separator
  const CustomSeparator = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <div className="breadcrumbs-examples">
      <h2>Breadcrumbs Component Examples</h2>

      {/* BrowserRouter is required for Link components to work */}
      <BrowserRouter>
        <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0', padding: '20px' }}>
          <h3>Simple Breadcrumb (Home only)</h3>
          <Breadcrumbs items={homeOnlyBreadcrumbs} />
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0', padding: '20px' }}>
          <h3>Category Page Breadcrumbs</h3>
          <Breadcrumbs items={categoryBreadcrumbs} />
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0', padding: '20px' }}>
          <h3>Product Detail Breadcrumbs</h3>
          <Breadcrumbs items={productBreadcrumbs} />
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0', padding: '20px' }}>
          <h3>Custom Separator</h3>
          <Breadcrumbs 
            items={categoryBreadcrumbs} 
            separator={<CustomSeparator />} 
          />
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '8px', margin: '20px 0', padding: '20px' }}>
          <h3>Text Separator</h3>
          <Breadcrumbs 
            items={categoryBreadcrumbs} 
            separator=">" 
          />
        </div>
      </BrowserRouter>
    </div>
  );
};

export default BreadcrumbsExample; 