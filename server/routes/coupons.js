import express from 'express';
const router = express.Router();
import Coupon from '../models/Coupon.js';
import { auth as authMiddleware, requireAdmin as adminMiddleware } from '../middleware/auth.js';

// Get all coupons - Admin only
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.getAll();
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Get coupon by ID - Admin only
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.getById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error) {
    console.error(`Error fetching coupon with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// Create a new coupon - Admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const couponData = req.body;
    
    // Validate required fields
    if (!couponData.code || !couponData.discount_type || !couponData.discount_value || 
        !couponData.start_date || !couponData.expiry_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, discount_type, discount_value, start_date, expiry_date' 
      });
    }
    
    const newCoupon = await Coupon.create(couponData);
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    
    if (error.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update a coupon - Admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const couponData = req.body;
    const updatedCoupon = await Coupon.update(req.params.id, couponData);
    
    if (!updatedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json(updatedCoupon);
  } catch (error) {
    console.error(`Error updating coupon with ID ${req.params.id}:`, error);
    
    if (error.message.includes('duplicate')) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete a coupon - Admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const success = await Coupon.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(`Error deleting coupon with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Validate a coupon code - Available to authenticated users
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code, orderAmount, items } = req.body;
    
    if (!code || !orderAmount) {
      return res.status(400).json({ error: 'Missing required fields: code, orderAmount' });
    }
    
    const validationResult = await Coupon.validateCoupon(code, orderAmount, items);
    res.json(validationResult);
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
