import { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_OjVlCpSLytdwMx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '970t2T1ivVsJW5gqWysKEshp',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Create order request body:', req.body);
    const { amount, orderId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
      currency: 'INR',
      receipt: orderId || `order_${Date.now()}`,
      notes: {
        orderType: orderId ? 'existing' : 'new',
        orderId: orderId || '',
      },
    };

    console.log('Creating Razorpay order with options:', options);
    
    try {
      const order = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order);
      return res.status(200).json(order);
    } catch (rzpError: any) {
      console.error('Razorpay API error:', rzpError);
      return res.status(500).json({
        error: 'Razorpay API error',
        details: rzpError.message || 'Unknown Razorpay error'
      });
    }
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({ 
      error: 'Error creating order',
      details: error.message || 'Unknown error'
    });
  }
}
