import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { applyBrowserFixes, checkFeatureSupport } from './utils/browserDetect';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Apply browser compatibility fixes
const { browser, version } = applyBrowserFixes();

// Check feature support and log warnings for missing features
const featureSupport = checkFeatureSupport();
Object.entries(featureSupport).forEach(([feature, supported]) => {
  if (!supported) {
    console.warn(`Browser compatibility warning: ${feature} is not supported in your browser.`);
  }
});

// Add browser info to window for debugging
window.browserInfo = { browser, version, featureSupport };

// Add global error handler for cross-browser compatibility
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // You could send these errors to a monitoring service
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer 
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
