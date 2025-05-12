/*
  # Add Customer Feedback System

  1. New Table
    - `order_feedback`
      - Store customer feedback for orders
      - Link to orders and order_items
      - Track ratings and comments for both the overall order and individual items

  2. Security
    - Enable RLS on the table
    - Add appropriate policies for public access in admin dashboard
*/

-- Create feedback rating type
CREATE TYPE feedback_rating AS ENUM (
  'excellent',
  'good',
  'average',
  'poor',
  'very_poor'
);

-- Create order_feedback table
CREATE TABLE IF NOT EXISTS order_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  food_quality_rating INT NOT NULL CHECK (food_quality_rating BETWEEN 1 AND 5),
  service_rating INT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  delivery_time_rating INT CHECK (delivery_time_rating BETWEEN 1 AND 5),
  value_for_money_rating INT CHECK (value_for_money_rating BETWEEN 1 AND 5),
  comments TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items_feedback JSONB DEFAULT '[]', -- Array of {item_id, item_name, rating, comment}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_feedback_updated_at
BEFORE UPDATE ON order_feedback
FOR EACH ROW
EXECUTE PROCEDURE update_feedback_updated_at();

-- Create function to validate and enrich feedback
CREATE OR REPLACE FUNCTION validate_feedback()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  customer_record RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
  
  -- If user_id is not provided, try to get it from the order
  IF NEW.user_id IS NULL AND order_record.user_id IS NOT NULL THEN
    NEW.user_id := order_record.user_id;
  END IF;
  
  -- If customer details are not provided, try to get them from the order or profile
  IF (NEW.customer_name IS NULL OR NEW.customer_name = '') AND order_record.customer_name IS NOT NULL THEN
    NEW.customer_name := order_record.customer_name;
  END IF;
  
  -- Get customer details from profile if available
  IF NEW.user_id IS NOT NULL THEN
    SELECT * INTO customer_record FROM profiles WHERE id = NEW.user_id;
    
    -- Fill in missing customer details from profile
    IF (NEW.customer_name IS NULL OR NEW.customer_name = '') AND customer_record.name IS NOT NULL THEN
      NEW.customer_name := customer_record.name;
    END IF;
    
    IF (NEW.customer_email IS NULL OR NEW.customer_email = '') AND customer_record.email IS NOT NULL THEN
      NEW.customer_email := customer_record.email;
    END IF;
    
    IF (NEW.customer_phone IS NULL OR NEW.customer_phone = '') AND customer_record.phone IS NOT NULL THEN
      NEW.customer_phone := customer_record.phone;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback validation
CREATE TRIGGER tr_validate_feedback
BEFORE INSERT ON order_feedback
FOR EACH ROW
EXECUTE PROCEDURE validate_feedback();

-- Create indexes for faster querying
CREATE INDEX idx_order_feedback_order_id ON order_feedback(order_id);
CREATE INDEX idx_order_feedback_user_id ON order_feedback(user_id);
CREATE INDEX idx_order_feedback_created_at ON order_feedback(created_at);
CREATE INDEX idx_order_feedback_overall_rating ON order_feedback(overall_rating);

-- Enable RLS
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can view all feedback (for admin dashboard without authentication)
CREATE POLICY "Public can view all feedback" 
  ON order_feedback FOR SELECT 
  TO public
  USING (true);

-- Public can submit feedback
CREATE POLICY "Public can submit feedback" 
  ON order_feedback FOR INSERT 
  TO public
  WITH CHECK (true);

-- Add order_has_feedback column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS has_feedback BOOLEAN DEFAULT false;

-- Create function to update has_feedback flag on orders
CREATE OR REPLACE FUNCTION update_order_feedback_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET has_feedback = true
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order's feedback status
CREATE TRIGGER tr_update_order_feedback_status
AFTER INSERT ON order_feedback
FOR EACH ROW
EXECUTE PROCEDURE update_order_feedback_status();
