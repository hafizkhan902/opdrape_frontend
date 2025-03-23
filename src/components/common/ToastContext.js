import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Note: You may need to install this package
import Toast from './Toast';
import './ToastContainer.css';

const ToastContext = createContext();

/**
 * Provides toast functionality throughout the application
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast to the array
  const addToast = useCallback((props) => {
    const id = uuidv4();
    const toast = { id, ...props };
    
    setToasts(prevToasts => [...prevToasts, toast]);
    return id;
  }, []);

  // Remove a toast by its ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Helper methods for common toast types
  const showSuccessToast = useCallback((message, options = {}) => {
    return addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const showErrorToast = useCallback((message, options = {}) => {
    return addToast({ message, type: 'error', ...options });
  }, [addToast]);

  const showWarningToast = useCallback((message, options = {}) => {
    return addToast({ message, type: 'warning', ...options });
  }, [addToast]);

  const showInfoToast = useCallback((message, options = {}) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  // Group toasts by position
  const groupedToasts = toasts.reduce((groups, toast) => {
    const position = toast.position || 'bottom-center';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(toast);
    return groups;
  }, {});

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        showSuccessToast,
        showErrorToast,
        showWarningToast,
        showInfoToast,
      }}
    >
      {children}

      {/* Toast container for each position */}
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className={`toast-container toast-container--${position}`}>
          {positionToasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
};

/**
 * Hook to use the toast functionality in components
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Wrap this comment for those not using uuid package
// If you don't want to install uuid, you can use this simple ID generator:
/* 
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}
*/ 