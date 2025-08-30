import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const router = express.Router();

// Razorpay credentials - using the environment variables
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_OjVlCpSLytdwMx';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '970t2T1ivVsJW5gqWysKEshp';

console.log('Initializing Razorpay with key_id:', razorpayKeyId);

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Create order
router.post('/create-order', async (req, res) => {
  try {
    console.log('Received create-order request:', req.body);
    console.log('Request headers:', req.headers);
    const { amount, orderId } = req.body;
    
    // Validate amount
    if (!amount) {
      console.error('Missing required parameter: amount');
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Validate orderId
    if (!orderId) {
      console.error('Missing required parameter: orderId');
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Parse amount to ensure it's a valid number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    const options = {
      amount: Math.round(parsedAmount * 100), // Convert to paise and ensure it's an integer
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderType: 'existing',
        orderId: orderId,
      },
    };
    
    console.log('Creating Razorpay order with options:', options);
    
    try {
      console.log('Invoking Razorpay API with options:', JSON.stringify(options));
      const order = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order);
      res.json(order);
    } catch (rzpError) {
      console.error('Razorpay API error:', rzpError);
      console.error('Error details:', JSON.stringify(rzpError));
      res.status(500).json({ 
        error: 'Razorpay API error', 
        details: rzpError.message || 'Unknown Razorpay error',
        code: rzpError.code || 'unknown'
      });
    }
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      error: 'Error creating order',
      details: error.message || 'Unknown error' 
    });
  }
});

// Verify payment
router.post('/verify-payment', async (req, res) => {
  try {
    console.log('Received verify-payment request:', req.body);
    console.log('Request headers:', req.headers);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Validate required parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required parameters for payment verification');
      return res.status(400).json({ 
        error: 'Missing required parameters: order_id, payment_id or signature', 
        verified: false 
      });
    }
    
    try {
      // Generate the expected signature
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const secret = razorpayKeySecret;
      const expectedSign = crypto
        .createHmac('sha256', secret)
        .update(sign)
        .digest('hex');
      
      console.log('Signature verification:', {
        expected: expectedSign,
        received: razorpay_signature,
        match: razorpay_signature === expectedSign
      });

      if (razorpay_signature === expectedSign) {
        console.log('Signature verification successful');
        res.json({ 
          verified: true, 
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id 
        });
      } else {
        console.log('Signature verification failed');
        res.status(400).json({ 
          verified: false,
          error: 'Invalid signature' 
        });
      }
    } catch (cryptoError) {
      console.error('Error generating signature:', cryptoError);
      return res.status(500).json({
        error: 'Internal server error during signature verification',
        verified: false
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Error verifying payment', 
      details: error.message || 'Unknown error',
      verified: false 
    });
  }
});

// Add a test endpoint to verify Razorpay credentials
router.get('/test-credentials', (req, res) => {
  try {
    console.log('Testing Razorpay credentials');
    res.json({
      keyId: razorpayKeyId.substring(0, 5) + '...',
      keySecret: razorpayKeySecret.substring(0, 5) + '...',
      initialized: !!razorpay
    });
  } catch (error) {
    console.error('Error in test-credentials endpoint:', error);
    res.status(500).json({ error: 'Error testing credentials' });
  }
});

export default router;