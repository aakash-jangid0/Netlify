import { loadScript } from '../utils/loadScript';

const RAZORPAY_KEY = 'rzp_test_iSAKYxEanpOxhX';

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

export const createRazorpayOrder = async (amount: number) => {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const openRazorpayCheckout = (options: RazorpayOptions) => {
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: options.amount,
      currency: options.currency || 'INR',
      order_id: options.orderId,
      name: options.name,
      description: options.description,
      prefill: options.prefill,
      theme: options.theme || { color: '#F97316' },
      handler: (response: any) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'));
        },
      },
    });

    rzp.open();
  });
};