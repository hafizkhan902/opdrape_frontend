import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import './PaymentFormExample.css';

/**
 * Example component to demonstrate the use of the PaymentForm component
 * Shows the form in various states and handling payment completion
 */
const PaymentFormExample = () => {
  // State to store the selected demo type
  const [demoType, setDemoType] = useState('basic');
  
  // State to track payment status
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // State to track loading status for payment processing demo
  const [loading, setLoading] = useState(false);
  
  // Payment amounts for different demos
  const amounts = {
    basic: 2499,
    loading: 3799,
    result: 1899,
  };

  // Handle demo type change
  const handleDemoChange = (event) => {
    setDemoType(event.target.value);
    // Reset payment status when changing demo
    setPaymentStatus(null);
    setLoading(false);
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentResult) => {
    console.log('Payment completed:', paymentResult);
    
    // For loading demo, simulate a delay before completion
    if (demoType === 'loading') {
      setTimeout(() => {
        setLoading(false);
        setPaymentStatus({
          success: true,
          ...paymentResult
        });
      }, 2000);
    } else {
      // For other demos, complete immediately
      setPaymentStatus({
        success: true,
        ...paymentResult
      });
    }
  };

  // Handle payment cancellation
  const handleCancel = () => {
    console.log('Payment cancelled');
    
    if (demoType === 'loading') {
      setLoading(false);
    }
    
    setPaymentStatus({
      success: false,
      message: 'Payment was cancelled by the user.'
    });
  };

  // Handle starting a new payment (reset state)
  const handleNewPayment = () => {
    setPaymentStatus(null);
    setLoading(false);
  };

  // Start the payment process for the loading demo
  const startPaymentProcess = () => {
    setLoading(true);
  };

  // Format the price
  const formatPrice = (price) => {
    return (price / 100).toFixed(2);
  };

  return (
    <div className="payment-example">
      <h2 className="payment-example__title">Payment Method Selection</h2>
      
      {/* Demo selector */}
      <div className="payment-example__selector">
        <label className={demoType === 'basic' ? 'active' : ''}>
          <input
            type="radio"
            name="demo"
            value="basic"
            checked={demoType === 'basic'}
            onChange={handleDemoChange}
          />
          <span>Standard Checkout</span>
        </label>
        <label className={demoType === 'loading' ? 'active' : ''}>
          <input
            type="radio"
            name="demo"
            value="loading"
            onChange={handleDemoChange}
          />
          <span>Processing Demo</span>
        </label>
        <label className={demoType === 'result' ? 'active' : ''}>
          <input
            type="radio"
            name="demo"
            value="result"
            onChange={handleDemoChange}
          />
          <span>Payment Result</span>
        </label>
      </div>
      
      {/* Description of the demo */}
      <div className="payment-example__description">
        {demoType === 'basic' && (
          <p>Choose your preferred payment method: Bkash, Nagad, or Cash on Delivery.</p>
        )}
        {demoType === 'loading' && (
          <p>This demo shows the payment form with loading state during processing.</p>
        )}
        {demoType === 'result' && (
          <p>Demonstrates successful or failed payment results.</p>
        )}
      </div>
      
      {/* API Endpoint Information */}
      <div className="payment-example__api-info">
        <h3>API Endpoint</h3>
        <code>POST /api/payment/process</code>
        <p>This endpoint processes mobile payments or records cash on delivery orders.</p>
      </div>
      
      {/* Order Summary */}
      <div className="payment-example__order-summary">
        <h3>Order Summary</h3>
        <div className="payment-example__order-items">
          <div className="payment-example__order-item">
            <span>Premium T-shirt (Black, L)</span>
            <span>${formatPrice(1299)}</span>
          </div>
          <div className="payment-example__order-item">
            <span>Denim Jeans (30, Blue)</span>
            <span>${formatPrice(2499)}</span>
          </div>
          <div className="payment-example__order-divider"></div>
          <div className="payment-example__order-item payment-example__order-item--subtotal">
            <span>Subtotal</span>
            <span>${formatPrice(3798)}</span>
          </div>
          <div className="payment-example__order-item">
            <span>Shipping</span>
            <span>${formatPrice(amounts[demoType] === 1899 ? 0 : 599)}</span>
          </div>
          <div className="payment-example__order-item">
            <span>Discount</span>
            <span>-${formatPrice(amounts[demoType] === 1899 ? 1899 : 599)}</span>
          </div>
          <div className="payment-example__order-divider"></div>
          <div className="payment-example__order-item payment-example__order-item--total">
            <span>Total</span>
            <span>${formatPrice(amounts[demoType])}</span>
          </div>
        </div>
      </div>
      
      {/* Payment Form or Result Display */}
      <div className="payment-example__content">
        {demoType === 'loading' && !loading && !paymentStatus && (
          <div className="payment-example__start-demo">
            <p>Click below to proceed to payment:</p>
            <button 
              className="payment-example__start-button"
              onClick={startPaymentProcess}
            >
              Proceed to Payment
            </button>
          </div>
        )}
        
        {(demoType !== 'loading' || loading) && !paymentStatus && (
          <PaymentForm
            amount={amounts[demoType] / 100}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handleCancel}
            loading={demoType === 'loading' && loading}
          />
        )}
        
        {paymentStatus && (
          <div className={`payment-example__result ${paymentStatus.success ? 'payment-example__result--success' : 'payment-example__result--error'}`}>
            {paymentStatus.success ? (
              <>
                <div className="payment-example__success-icon">
                  <svg viewBox="0 0 24 24" width="60" height="60">
                    <path 
                      fill="currentColor" 
                      d="M12,0A12,12,0,1,0,24,12,12,12,0,0,0,12,0Zm6.93,8.2-6.85,9.29a1,1,0,0,1-1.43.19l-4.38-3.48a1,1,0,1,1,1.24-1.56L10.92,15,17.07,7a1,1,0,0,1,1.39-.16A1,1,0,0,1,18.93,8.2Z"
                    />
                  </svg>
                </div>
                <h3>Order Placed Successfully!</h3>
                <div className="payment-example__details">
                  <div className="payment-example__detail-item">
                    <span>Order ID:</span>
                    <span>{paymentStatus.transactionId}</span>
                  </div>
                  <div className="payment-example__detail-item">
                    <span>Amount:</span>
                    <span>${formatPrice(amounts[demoType] * 100)}</span>
                  </div>
                  <div className="payment-example__detail-item">
                    <span>Payment Method:</span>
                    <span className="payment-example__method">
                      <div className={`payment-example__method-icon payment-example__method-icon--${paymentStatus.paymentMethod}`}></div>
                      {paymentStatus.paymentMethod === 'bkash' ? 'Bkash' : 
                        paymentStatus.paymentMethod === 'nagad' ? 'Nagad' : 'Cash On Delivery'}
                    </span>
                  </div>
                  {paymentStatus.paymentMethod !== 'cod' && (
                    <div className="payment-example__detail-item">
                      <span>Mobile Number:</span>
                      <span>{paymentStatus.mobileNumber}</span>
                    </div>
                  )}
                </div>
                <div className="payment-example__message">
                  {paymentStatus.paymentMethod === 'cod' ? 
                    'Your order will be delivered in 3-5 business days. Payment will be collected upon delivery.' :
                    'Thank you for your payment. Your order will be processed shortly.'}
                </div>
              </>
            ) : (
              <>
                <div className="payment-example__error-icon">
                  <svg viewBox="0 0 24 24" width="60" height="60">
                    <path 
                      fill="currentColor" 
                      d="M12,0A12,12,0,1,0,24,12,12,12,0,0,0,12,0Zm4.71,15.29a1,1,0,0,1-1.42,1.42L12,13.41l-3.29,3.3a1,1,0,0,1-1.42-1.42L10.59,12,7.29,8.71A1,1,0,0,1,8.71,7.29L12,10.59l3.29-3.3a1,1,0,0,1,1.42,1.42L13.41,12Z"
                    />
                  </svg>
                </div>
                <h3>Payment Not Completed</h3>
                <p>{paymentStatus.message}</p>
              </>
            )}
            <button 
              className="payment-example__new-payment-button"
              onClick={handleNewPayment}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {/* Usage notes */}
      <div className="payment-example__notes">
        <h3>Component Usage</h3>
        <pre>{`
<PaymentForm
  amount={24.99}
  onPaymentComplete={(result) => {
    console.log('Payment completed:', result);
    // Handle successful payment
  }}
  onCancel={() => {
    console.log('Payment cancelled');
    // Handle payment cancellation
  }}
  loading={false}
/>
        `}</pre>
        <p>
          The PaymentForm component provides a minimal, modern interface for 
          selecting between Bkash, Nagad, and Cash On Delivery payment methods. 
          It collects necessary information based on the selected payment method
          and uses the /api/payment/process endpoint.
        </p>
      </div>
    </div>
  );
};

export default PaymentFormExample; 