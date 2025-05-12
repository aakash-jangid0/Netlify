import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '970t2T1ivVsJW5gqWysKEshp');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment verification successful
      return res.status(200).json({ 
        verified: true, 
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id 
      });
    } else {
      // Payment verification failed
      return res.status(400).json({ verified: false });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      error: 'Error verifying payment',
      details: error.message || 'Unknown error'
    });
  }
}
