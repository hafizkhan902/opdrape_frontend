import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.css';

/**
 * ErrorBoundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);

    // You could also log to an error tracking service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Attempt to recover the application
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(error, errorInfo, this.handleReset)
          : fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              We're sorry, but an error occurred while rendering this part of the application.
            </p>
            {error && (
              <div className="error-boundary__details">
                <p className="error-boundary__error">{error.toString()}</p>
                {this.props.showStack && errorInfo && (
                  <details className="error-boundary__stack">
                    <summary>View error details</summary>
                    <pre>{errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}
            <div className="error-boundary__actions">
              <button 
                className="error-boundary__button" 
                onClick={this.handleReset} 
                type="button"
              >
                Try Again
              </button>
              {this.props.showReportButton && (
                <button 
                  className="error-boundary__button error-boundary__button--secondary" 
                  onClick={() => this.props.onReport && this.props.onReport(error, errorInfo)} 
                  type="button"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Render children if there's no error
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onReset: PropTypes.func,
  onReport: PropTypes.func,
  showStack: PropTypes.bool,
  showReportButton: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showStack: process.env.NODE_ENV === 'development',
  showReportButton: true
};

export default ErrorBoundary; 