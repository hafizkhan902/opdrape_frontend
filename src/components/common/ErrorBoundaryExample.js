import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * A component that will throw an error when the button is clicked
 */
const BuggyCounter = () => {
  const [counter, setCounter] = useState(0);
  
  const handleClick = () => {
    setCounter(prevCounter => prevCounter + 1);
  };
  
  if (counter === 5) {
    // When counter reaches 5, simulate an error
    throw new Error('I crashed when the counter reached 5!');
  }
  
  return (
    <div className="buggy-counter">
      <h3>Buggy Counter Example</h3>
      <p>This component will crash when the counter reaches 5.</p>
      <p><strong>Current Count: {counter}</strong></p>
      <button
        onClick={handleClick}
        style={{ padding: '8px 16px', margin: '10px 0' }}
      >
        Increment Counter
      </button>
    </div>
  );
};

/**
 * A custom fallback component to use with ErrorBoundary
 */
const CustomFallback = (error, errorInfo, resetError) => (
  <div style={{ 
    border: '2px dashed #ffc107', 
    borderRadius: '8px', 
    padding: '20px',
    backgroundColor: '#fff9e6' 
  }}>
    <h3 style={{ color: '#f39c12' }}>Custom Error Display</h3>
    <p>Something broke in the counter component.</p>
    <p>Error message: <strong>{error.toString()}</strong></p>
    <button 
      onClick={resetError}
      style={{ 
        backgroundColor: '#ffc107', 
        border: 'none', 
        borderRadius: '4px',
        padding: '8px 16px', 
        margin: '10px 0', 
        cursor: 'pointer'
      }}
    >
      Reset Counter
    </button>
  </div>
);

/**
 * Example component to demonstrate how to use ErrorBoundary
 */
const ErrorBoundaryExample = () => {
  return (
    <div className="error-boundary-example">
      <h2>Error Boundary Examples</h2>
      
      <div className="error-boundary-example__section">
        <h3>Default Error Boundary</h3>
        <p>This error boundary uses the default UI when an error occurs:</p>
        <ErrorBoundary>
          <BuggyCounter />
        </ErrorBoundary>
      </div>
      
      <div className="error-boundary-example__section" style={{ marginTop: '40px' }}>
        <h3>Custom Error Boundary</h3>
        <p>This error boundary uses a custom fallback UI:</p>
        <ErrorBoundary fallback={CustomFallback}>
          <BuggyCounter />
        </ErrorBoundary>
      </div>
      
      <div className="error-boundary-example__section" style={{ marginTop: '40px' }}>
        <h3>Error Reporting Example</h3>
        <p>This error boundary has a custom error reporting function:</p>
        <ErrorBoundary 
          onReport={(error, errorInfo) => {
            // In a real app, you'd send this to your error tracking service
            console.log('Error reported:', error);
            console.log('Component stack:', errorInfo.componentStack);
            alert('Error was reported to the console. In a real app, this would go to your error tracking service.');
          }}
        >
          <BuggyCounter />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default ErrorBoundaryExample; 