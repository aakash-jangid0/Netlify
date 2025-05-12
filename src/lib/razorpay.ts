import { loadScript } from '../utils/loadScript';
import { RazorpayOptions as RazorpayCheckoutOptions, RazorpayResponse } from '../types/payment';

// Get environment variables safely for both Vite and Node.js environments
const getEnv = (key: string, defaultValue: string): string => {
  // Check for Vite's import.meta.env first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (value) return value;
  }
  
  // Fall back to default value
  return defaultValue;
};

// Using the provided test credentials
const RAZORPAY_KEY = getEnv('VITE_RAZORPAY_KEY_ID', 'rzp_test_OjVlCpSLytdwMx');

export interface RazorpayOptions {
  amount: number;
  currency?: string;
  orderId: string;
  name: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export const initializeRazorpay = async () => {
  return await loadScript('https://checkout.razorpay.com/v1/checkout.js');
};

export const createRazorpayOrder = async (amount: number, orderId?: string) => {
  try {
    console.log('Creating Razorpay order with params:', { amount, orderId });
    
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount for Razorpay order');
    }
    
    if (!orderId || orderId.trim() === '') {
      throw new Error('Order ID is required for Razorpay payment');
    }
    
    // Point to the Express server API route using the environment variable
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const endpoint = `${API_URL}/razorpay/create-order`;
    console.log('Sending request to Razorpay API endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, orderId }),
      credentials: 'include', // Include cookies for CORS
    });

    if (!response.ok) {
      console.error('Razorpay order API returned error status:', response.status);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
      } catch (e) {
        // If not valid JSON, use the text as is
        console.error('Could not parse error response as JSON');
        throw new Error(`API error: ${errorText || 'Failed to create order'}`);
      }
      
      throw new Error(errorData.error || 'Failed to create order');
    }

    const orderData = await response.json();
    console.log('Razorpay order created successfully:', orderData);
    return orderData;
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(error.message || 'Failed to create payment order');
  }
};

export const openRazorpayCheckout = (options: RazorpayOptions): Promise<RazorpayResponse> => {
  return new Promise((resolve, reject) => {
    try {
      const rzp = new (window as any).Razorpay({
        key: RAZORPAY_KEY,
        amount: options.amount,
        currency: options.currency || 'INR',
        order_id: options.orderId,
        name: options.name,
        description: options.description || 'Order Payment',
        prefill: options.prefill || {},
        theme: options.theme || { color: '#F97316' },
        handler: (response: RazorpayResponse) => {
          // Validate that required fields are present
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            reject(new Error('Invalid payment response'));
            return;
          }
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
          escape: true,
          animation: true,
        },
        notes: {
          order_id: options.orderId,
        }
      });

      rzp.on('payment.failed', (response: any) => {
        reject(new Error(response.error.description || 'Payment failed'));
      });

      rzp.open();
    } catch (error) {
      reject(error || new Error('Failed to initialize payment'));
    }
  });
};