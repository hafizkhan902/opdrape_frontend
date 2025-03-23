import React, { useState } from 'react';
import Toast from './Toast';
import { ToastProvider, useToast } from './ToastContext';

/**
 * Example component demonstrating individual Toast usage
 */
const IndividualToastExample = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState('bottom-center');
  const [type, setType] = useState('info');

  const showToast = () => setIsVisible(true);
  const hideToast = () => setIsVisible(false);

  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
      <h3>Individual Toast Example</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Position:</label>
        <select 
          value={position} 
          onChange={e => setPosition(e.target.value)}
          style={{ padding: '5px' }}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Type:</label>
        <select 
          value={type} 
          onChange={e => setType(e.target.value)}
          style={{ padding: '5px' }}
        >
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      <button 
        onClick={showToast}
        style={{ 
          background: '#4a69bd', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          padding: '8px 16px', 
          marginRight: '10px',
          cursor: 'pointer'
        }}
      >
        Show Toast
      </button>

      <Toast 
        message={`This is a ${type} toast message!`}
        type={type}
        isVisible={isVisible}
        position={position}
        onClose={hideToast}
        duration={5000}
      />
    </div>
  );
};

/**
 * Example component demonstrating Toast Context usage
 */
const ToastContextExample = () => {
  const { 
    showSuccessToast, 
    showErrorToast, 
    showWarningToast, 
    showInfoToast 
  } = useToast();

  const buttonStyle = { 
    border: 'none', 
    borderRadius: '4px', 
    padding: '8px 16px', 
    marginRight: '10px',
    marginBottom: '10px',
    cursor: 'pointer',
    color: 'white',
  };

  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px' }}>
      <h3>Toast Context Example</h3>
      <p>Click buttons to show different types of toasts using the Toast Context:</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={() => showSuccessToast('Operation completed successfully!')}
          style={{ ...buttonStyle, background: '#4caf50' }}
        >
          Success Toast
        </button>

        <button 
          onClick={() => showErrorToast('An error occurred while processing your request.')}
          style={{ ...buttonStyle, background: '#f44336' }}
        >
          Error Toast
        </button>

        <button 
          onClick={() => showWarningToast('Warning: This action cannot be undone.')}
          style={{ ...buttonStyle, background: '#ff9800' }}
        >
          Warning Toast
        </button>

        <button 
          onClick={() => showInfoToast('New update available.')}
          style={{ ...buttonStyle, background: '#2196f3' }}
        >
          Info Toast
        </button>
      </div>

      <h4>Custom Position Examples:</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <button 
          onClick={() => 
            showInfoToast('This toast appears in the top-left corner', { 
              position: 'top-left',
              duration: 3000
            })
          }
          style={{ ...buttonStyle, background: '#9c27b0' }}
        >
          Top Left Toast
        </button>

        <button 
          onClick={() => 
            showInfoToast('This toast appears in the top-right corner', { 
              position: 'top-right',
              duration: 3000
            })
          }
          style={{ ...buttonStyle, background: '#009688' }}
        >
          Top Right Toast
        </button>

        <button 
          onClick={() => 
            showInfoToast('This toast appears in the bottom-right corner', { 
              position: 'bottom-right',
              duration: 3000
            })
          }
          style={{ ...buttonStyle, background: '#795548' }}
        >
          Bottom Right Toast
        </button>
      </div>
    </div>
  );
};

/**
 * Main Toast example component
 */
const ToastExample = () => {
  return (
    <div className="toast-examples">
      <h2>Toast Component Examples</h2>

      <IndividualToastExample />

      <ToastProvider>
        <ToastContextExample />
      </ToastProvider>
    </div>
  );
};

export default ToastExample; 