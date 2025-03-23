import React, { useState, useEffect } from 'react';
import Loader from './Loader';

/**
 * Example component to demonstrate how to use the Loader component
 */
const LoaderExample = () => {
  const [loading, setLoading] = useState(true);
  const [loadingFullScreen, setLoadingFullScreen] = useState(false);
  
  // Simulate data loading
  useEffect(() => {
    // Automatically stop the regular loader after 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Toggle full screen loader
  const handleToggleFullScreen = () => {
    setLoadingFullScreen(true);
    
    // Automatically turn off full screen loader after 2 seconds
    setTimeout(() => {
      setLoadingFullScreen(false);
    }, 2000);
  };
  
  return (
    <div className="loader-example">
      <h2>Loader Component Examples</h2>
      
      <div className="loader-example__section">
        <h3>Inline Loader</h3>
        {loading ? (
          <Loader text="Loading data..." />
        ) : (
          <div>
            <p>Data has been loaded successfully!</p>
            <button 
              onClick={() => setLoading(true)}
              style={{ padding: '8px 16px', margin: '10px 0' }}
            >
              Reload Data
            </button>
          </div>
        )}
      </div>
      
      <div className="loader-example__section">
        <h3>Loader Size Variants</h3>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h4>Small</h4>
            <Loader size="small" text="" />
          </div>
          <div>
            <h4>Medium (Default)</h4>
            <Loader size="medium" text="" />
          </div>
          <div>
            <h4>Large</h4>
            <Loader size="large" text="" />
          </div>
        </div>
      </div>
      
      <div className="loader-example__section">
        <h3>Loader Color Variants</h3>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h4>Primary</h4>
            <Loader color="primary" text="" />
          </div>
          <div>
            <h4>Secondary</h4>
            <Loader color="secondary" text="" />
          </div>
          <div>
            <h4>Dark</h4>
            <Loader color="dark" text="" />
          </div>
          <div>
            <h4>Light</h4>
            <Loader color="light" text="" />
          </div>
        </div>
      </div>
      
      <div className="loader-example__section">
        <h3>Full Screen Loader</h3>
        <p>Click the button below to show a full screen loader for 2 seconds</p>
        <button
          onClick={handleToggleFullScreen}
          style={{ padding: '8px 16px', margin: '10px 0' }}
        >
          Show Full Screen Loader
        </button>
      </div>
      
      {loadingFullScreen && (
        <Loader 
          fullScreen={true} 
          size="large"
          text="Loading content, please wait..." 
        />
      )}
    </div>
  );
};

export default LoaderExample; 