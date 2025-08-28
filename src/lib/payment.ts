import { toast } from 'react-hot-toast';
import { PaymentData, PaymentMethod, PaymentStatus, RazorpayResponse } from '../types/payment';

/**
 * Verify a Razorpay payment with the server
 * 
 * @param paymentData Razorpay payment data returned from checkout
 * @returns Object with verified status and order data
 */
export const verifyRazorpayPayment = async (paymentData: RazorpayResponse): Promise<{
  verified: boolean;
  orderId: string;
  paymentId: string;
}> => {
  try {    console.log('Verifying Razorpay payment:', paymentData);
    // Point to the Express server API route using dynamic URL detection
    const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
    const API_URL = isDevelopment 
      ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      : `${window.location.origin}/api`;
    const endpoint = `${API_URL}/razorpay/verify-payment`;
    console.log('Sending request to Razorpay verification endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
      credentials: 'include', // Include cookies for CORS
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error verifying payment:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Payment verification failed');
      } catch {
        throw new Error(`API error: ${errorText || 'Payment verification failed'}`);
      }
    }

    const data = await response.json();
    console.log('Payment verification result:', data);
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed. Please contact support.';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Save payment information to the database
 * 
 * @param orderId Order ID
 * @param paymentDetails Payment details including method, status, and transaction data
 * @returns Server response
 */
export const savePaymentDetails = async (
  orderId: string, 
  amount: number,
  method: PaymentMethod,
  status: PaymentStatus,
  transactionId?: string,
  transactionData?: Record<string, unknown>
): Promise<{ success: boolean; data: PaymentData }> => {
  try {    console.log('Saving payment details:', { orderId, amount, method, status, transactionId });
    
    // Get API URL from dynamic detection
    const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
    const API_URL = isDevelopment 
      ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      : `${window.location.origin}/api`;
    const endpoint = `${API_URL}/payments`;
    console.log('Saving payment details to endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        method,
        status,
        transactionId,
        transactionData
      }),
      credentials: 'include', // Include cookies for CORS
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save payment details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving payment details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record payment. Please contact support.';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Process a payment with Razorpay checkout
 * 
 * @param orderId Order ID
 * @param amount Amount in INR
 * @param customerInfo Customer information
 * @returns Payment result
 */
export const processRazorpayPayment = async (
  orderId: string,
  amount: number,
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
  }
) => {
  try {
    console.log('Payment process started with:', { orderId, amount, customerInfo });
    
    // Validate inputs
    if (!orderId) {
      console.error('Missing orderId in processRazorpayPayment');
      throw new Error('Order ID is required for payment processing');
    }
    
    if (!amount || amount <= 0) {
      console.error('Invalid amount in processRazorpayPayment:', amount);
      throw new Error('Valid payment amount is required');
    }
    
    // Import dynamically to ensure this only runs on the client side
    console.log('Importing Razorpay modules...');
    const { initializeRazorpay, createRazorpayOrder, openRazorpayCheckout } = await import('./razorpay');
    
    // Initialize Razorpay
    console.log('Initializing Razorpay...');
    const isRazorpayLoaded = await initializeRazorpay();
    if (!isRazorpayLoaded) {
      console.error('Failed to load Razorpay SDK');
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }
    console.log('Razorpay SDK loaded successfully');
    
    // Create order
    console.log(`Creating Razorpay order for amount: ${amount}, orderId: ${orderId}`);
    const order = await createRazorpayOrder(amount, orderId);
    console.log('Razorpay order created:', order);

    // Open Razorpay checkout
    console.log('Opening Razorpay checkout...');    const response = await openRazorpayCheckout({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      orderId: order.id,
      name: import.meta.env.VITE_BUSINESS_NAME || 'TastyBites',
      description: `Order #${orderId}`,
      prefill: {
        name: customerInfo.name || 'Customer',
        email: customerInfo.email || '',
        contact: customerInfo.phone || ''
      },
      theme: {
        color: '#F97316'
      }
    });
    
    console.log('Razorpay checkout completed:', response);

    // Verify the payment
    console.log('Verifying payment...');
    const verificationResult = await verifyRazorpayPayment(response);
    console.log('Verification result:', verificationResult);
    
    if (verificationResult.verified) {
      console.log('Payment verified! Saving payment details...');
      // Save payment details to database
      await savePaymentDetails(
        orderId,
        amount,
        'razorpay',
        'completed',
        response.razorpay_payment_id,
        response as unknown as Record<string, unknown>
      );
    } else {
      throw new Error('Payment verification failed');
    }
    
    return {
      success: verificationResult.verified,
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id
    };
  } catch (error) {
    console.error('Error in processRazorpayPayment:', error);
    throw error; // Re-throw for proper handling in calling components
  } finally {
    // Cleanup operations if needed
    console.log('Payment process completed');
  }
};
