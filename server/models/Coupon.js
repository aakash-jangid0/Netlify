import { supabase } from '../lib/supabase.js';

class Coupon {
  /**
   * Fetch all coupons
   * @returns {Promise<Array>} Array of coupons
   */
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching coupons:', error.message);
      throw error;
    }
  }

  /**
   * Get a coupon by ID
   * @param {string} id Coupon ID
   * @returns {Promise<Object>} Coupon object
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching coupon with ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a coupon by its code
   * @param {string} code Coupon code
   * @returns {Promise<Object>} Coupon object
   */
  static async getByCode(code) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching coupon with code ${code}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new coupon
   * @param {Object} couponData Coupon data
   * @returns {Promise<Object>} Created coupon
   */
  static async create(couponData) {
    try {
      // Normalize coupon code to uppercase
      const normalizedData = {
        ...couponData,
        code: couponData.code.toUpperCase()
      };
      
      const { data, error } = await supabase
        .from('coupons')
        .insert(normalizedData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating coupon:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing coupon
   * @param {string} id Coupon ID
   * @param {Object} couponData Updated coupon data
   * @returns {Promise<Object>} Updated coupon
   */
  static async update(id, couponData) {
    try {
      // If code is being updated, normalize it to uppercase
      const normalizedData = couponData.code 
        ? { ...couponData, code: couponData.code.toUpperCase() }
        : couponData;
      
      const { data, error } = await supabase
        .from('coupons')
        .update(normalizedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating coupon with ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a coupon
   * @param {string} id Coupon ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting coupon with ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate a coupon code and check if it can be applied
   * @param {string} code Coupon code
   * @param {number} orderAmount Total order amount
   * @param {Array} items Cart items
   * @returns {Promise<Object>} Validation result with coupon and discount info
   */
  static async validateCoupon(code, orderAmount, items = []) {
    try {
      // Get the coupon
      const coupon = await this.getByCode(code);
      
      // If coupon doesn't exist
      if (!coupon) {
        return {
          valid: false,
          message: 'Invalid coupon code'
        };
      }
      
      // Check if coupon is active
      if (!coupon.is_active) {
        return {
          valid: false,
          message: 'This coupon is inactive'
        };
      }
      
      // Check date validity
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const expiryDate = new Date(coupon.expiry_date);
      
      if (now < startDate) {
        return {
          valid: false,
          message: `This coupon is not valid until ${startDate.toLocaleDateString()}`
        };
      }
      
      if (now > expiryDate) {
        return {
          valid: false,
          message: 'This coupon has expired'
        };
      }
      
      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          valid: false,
          message: 'This coupon has reached its usage limit'
        };
      }
      
      // Check minimum order amount
      if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
        return {
          valid: false,
          message: `Minimum order amount is Rs${coupon.min_order_amount}`
        };
      }
      
      // Calculate the discount amount
      let discountAmount = 0;
      
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderAmount * coupon.discount_value) / 100;
        
        // Cap the discount if max_discount_amount is set
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        // Fixed amount discount
        discountAmount = coupon.discount_value;
      }
      
      // Make sure discount doesn't exceed the order amount
      discountAmount = Math.min(discountAmount, orderAmount);
      
      return {
        valid: true,
        coupon,
        discountAmount,
        message: 'Coupon applied successfully'
      };
    } catch (error) {
      console.error(`Error validating coupon ${code}:`, error.message);
      return {
        valid: false,
        message: 'Error validating coupon'
      };
    }
  }

  /**
   * Increment the usage count for a coupon
   * @param {string} id Coupon ID
   * @returns {Promise<boolean>} Success status
   */
  static async incrementUsage(id) {
    try {
      const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: id });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error incrementing usage for coupon with ID ${id}:`, error.message);
      throw error;
    }
  }
}

export default Coupon;
