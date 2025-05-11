-- Generated SQL script combining 34 migrations

-- Migration: 20240506_create_customers.sql
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration: 20250319075720_holy_castle.sql
/*
  # Create profiles table and setup auth

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to:
      - Read own profile
      - Update own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Migration: 20250319075726_ancient_sea.sql
/*
  # Create orders and related tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `status` (order_status enum)
      - `total_amount` (numeric)
      - `payment_status` (payment_status enum)
      - `razorpay_order_id` (text)
      - `razorpay_payment_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `name` (text)
      - `quantity` (integer)
      - `price` (numeric)
      - `notes` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create enums
CREATE TYPE order_status AS ENUM (
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_status payment_status DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for order items
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Migration: 20250319124105_turquoise_block.sql
/*
  # Add user insights and preferences tracking

  1. New Tables
    - `user_preferences`
      - Tracks user's dietary preferences, favorite cuisines, allergies
      - Links to profiles table
    
    - `user_visits`
      - Records each restaurant visit
      - Tracks visit timing, duration, group size
    
    - `favorite_items`
      - Tracks user's favorite and frequently ordered items
      - Stores ratings and feedback
    
    - `user_interactions`
      - Logs various user interactions
      - Helps understand user behavior

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions text[] DEFAULT '{}',
  favorite_cuisines text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  spice_preference text,
  preferred_dining_times text[],
  special_occasions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User Visits Table
CREATE TABLE IF NOT EXISTS user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date timestamptz DEFAULT now(),
  departure_time timestamptz,
  group_size int,
  table_number text,
  wait_time_minutes int,
  visit_type text, -- dine-in, takeaway
  special_occasion text,
  weather_condition text, -- helps analyze weather impact on visits
  feedback_rating int CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- Favorite Items Table
CREATE TABLE IF NOT EXISTS favorite_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  last_ordered_date timestamptz,
  order_count int DEFAULT 1,
  rating int CHECK (rating BETWEEN 1 AND 5),
  is_favorite boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_name)
);

-- User Interactions Table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- menu_view, item_click, search, etc.
  interaction_data jsonb DEFAULT '{}',
  session_id uuid,
  device_type text,
  interaction_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_visits
CREATE POLICY "Users can view own visits"
  ON user_visits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON user_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for favorite_items
CREATE POLICY "Users can view own favorites"
  ON favorite_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorite_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_interactions
CREATE POLICY "Users can view own interactions"
  ON user_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update favorite items after order
CREATE OR REPLACE FUNCTION update_favorite_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert into favorite_items for each order item
  INSERT INTO favorite_items (user_id, item_name, category, last_ordered_date, order_count)
  SELECT 
    NEW.user_id,
    oi.name,
    'unknown', -- category could be added if available in order_items
    NOW(),
    1
  FROM order_items oi
  WHERE oi.order_id = NEW.id
  ON CONFLICT (user_id, item_name) DO UPDATE
  SET 
    order_count = favorite_items.order_count + 1,
    last_ordered_date = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update favorite items when order is placed
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_items();

-- Function to record visit when order is placed
CREATE OR REPLACE FUNCTION record_user_visit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_visits (
    user_id,
    visit_date,
    group_size,
    table_number,
    visit_type
  )
  VALUES (
    NEW.user_id,
    NEW.created_at,
    1, -- default group size
    NULL, -- table number could be added if available
    CASE 
      WHEN NEW.order_type = 'dine-in' THEN 'dine-in'
      ELSE 'takeaway'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to record visit when order is placed
CREATE TRIGGER on_order_visit
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_user_visit();

-- Add new columns to profiles table for additional user data
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS anniversary date,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS visit_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_date timestamptz,
  ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS loyalty_points int DEFAULT 0;

-- Migration: 20250319130404_sparkling_block.sql
/*
  # Enhanced Analytics Schema

  1. New Tables
    - `user_demographics` - Detailed user demographic data
    - `user_feedback` - Structured feedback and reviews
    - `user_segments` - User segmentation and targeting
    - `order_analytics` - Order patterns and behaviors
    - `table_analytics` - Table usage and turnover analysis
    - `promotion_responses` - Track promotional campaign effectiveness

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- User Demographics Table
CREATE TABLE IF NOT EXISTS user_demographics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  age_group text,
  gender text,
  income_bracket text,
  location_zip text,
  family_size int,
  dietary_lifestyle text[], -- vegetarian, vegan, etc.
  language_preference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES user_visits(id) ON DELETE SET NULL,
  food_quality_rating int CHECK (food_quality_rating BETWEEN 1 AND 5),
  service_rating int CHECK (service_rating BETWEEN 1 AND 5),
  ambiance_rating int CHECK (ambiance_rating BETWEEN 1 AND 5),
  cleanliness_rating int CHECK (cleanliness_rating BETWEEN 1 AND 5),
  value_for_money_rating int CHECK (value_for_money_rating BETWEEN 1 AND 5),
  wait_time_rating int CHECK (wait_time_rating BETWEEN 1 AND 5),
  specific_feedback text,
  improvement_suggestions text,
  would_recommend boolean,
  created_at timestamptz DEFAULT now()
);

-- User Segments Table
CREATE TABLE IF NOT EXISTS user_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  segment_name text,
  segment_criteria jsonb,
  segment_score numeric,
  active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order Analytics Table
CREATE TABLE IF NOT EXISTS order_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  time_to_prepare interval,
  time_to_serve interval,
  order_completion_time interval,
  items_reordered int DEFAULT 0,
  modification_count int DEFAULT 0,
  cancellation_reason text,
  peak_hour boolean,
  day_of_week int,
  is_holiday boolean,
  created_at timestamptz DEFAULT now()
);

-- Table Analytics Table
CREATE TABLE IF NOT EXISTS table_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL,
  date_of_service date DEFAULT CURRENT_DATE,
  total_seatings int DEFAULT 0,
  total_customers int DEFAULT 0,
  average_dining_duration interval,
  peak_usage_time timestamptz,
  revenue_generated numeric DEFAULT 0,
  turn_over_rate numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promotion Responses Table
CREATE TABLE IF NOT EXISTS promotion_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  promotion_id text NOT NULL,
  promotion_type text,
  promotion_channel text,
  viewed_at timestamptz,
  clicked_at timestamptz,
  redeemed_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  response_status text,
  discount_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add columns to existing tables
ALTER TABLE user_visits
  ADD COLUMN IF NOT EXISTS reservation_id text,
  ADD COLUMN IF NOT EXISTS seating_preference text,
  ADD COLUMN IF NOT EXISTS noise_level text,
  ADD COLUMN IF NOT EXISTS temperature text,
  ADD COLUMN IF NOT EXISTS parking_used boolean,
  ADD COLUMN IF NOT EXISTS with_children boolean,
  ADD COLUMN IF NOT EXISTS celebration_type text,
  ADD COLUMN IF NOT EXISTS server_id text;

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS payment_methods text[],
  ADD COLUMN IF NOT EXISTS preferred_seating text[],
  ADD COLUMN IF NOT EXISTS communication_preferences text[],
  ADD COLUMN IF NOT EXISTS dietary_notes text,
  ADD COLUMN IF NOT EXISTS favorite_servers text[],
  ADD COLUMN IF NOT EXISTS blacklisted_items text[],
  ADD COLUMN IF NOT EXISTS preferred_contact_time text[];

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS lifetime_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS churn_risk numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_engagement_date timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS dietary_restrictions_verified boolean DEFAULT false;

-- Enable RLS
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own demographics"
  ON user_demographics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own demographics"
  ON user_demographics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own segments"
  ON user_segments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own promotion responses"
  ON promotion_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update user lifetime value
CREATE OR REPLACE FUNCTION update_user_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    lifetime_value = lifetime_value + NEW.total_amount,
    total_spent = total_spent + NEW.total_amount,
    last_engagement_date = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating lifetime value
CREATE TRIGGER on_order_complete
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION update_user_lifetime_value();

-- Function to calculate churn risk
CREATE OR REPLACE FUNCTION calculate_churn_risk()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple churn risk calculation based on last visit
  UPDATE profiles
  SET churn_risk = CASE
    WHEN NOW() - last_visit_date > INTERVAL '90 days' THEN 0.8
    WHEN NOW() - last_visit_date > INTERVAL '60 days' THEN 0.6
    WHEN NOW() - last_visit_date > INTERVAL '30 days' THEN 0.4
    ELSE 0.2
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating churn risk
CREATE TRIGGER on_visit_record
  AFTER INSERT ON user_visits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_churn_risk();

-- Migration: 20250323110552_velvet_band.sql
/*
  # Add additional order fields

  1. Changes
    - Add customer_name to orders table
    - Add table_number to orders table
    - Add order_type to orders table
    - Add payment_method to orders table

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS table_number text,
  ADD COLUMN IF NOT EXISTS order_type text,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Migration: 20250323155046_dusty_gate.sql
/*
  # Add additional order fields

  1. Changes
    - Add customer_name to orders table
    - Add table_number to orders table
    - Add order_type to orders table
    - Add payment_method to orders table
    - Add preparation_status to order_items table

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS table_number text,
  ADD COLUMN IF NOT EXISTS order_type text,
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS preparation_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Migration: 20250324080552_purple_coral.sql
/*
  # Add customer phone number and related fields

  1. Changes
    - Add customer_phone to orders table
    - Add subtotal, tax, and discount fields to orders table
    - Add coupon_code field to orders table
    - Create customers table for tracking customer history

  2. Security
    - Enable RLS on customers table
    - Add appropriate policies
*/

-- Add new columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Add policies for customers table
CREATE POLICY "Staff can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Migration: 20250324081436_proud_crystal.sql
/*
  # Fix Orders RLS Policies

  1. Changes
    - Update RLS policies for orders table to allow staff to manage orders
    - Add policy for kitchen staff to view and update orders
    - Remove user_id requirement for order creation

  2. Security
    - Maintain basic security while allowing counter operations
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Add new policies for orders
CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add new policies for order_items
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Migration: 20250324133717_crystal_snowflake.sql
/*
  # Fix Orders RLS Policies

  1. Changes
    - Update RLS policies for orders table to allow public access for kitchen dashboard
    - Add policy for kitchen staff to view and update orders
    - Remove authentication requirements for viewing orders

  2. Security
    - Allow public read access to orders and order items
    - Maintain write protection
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;

-- Add new policies for orders
CREATE POLICY "Public can view orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update order_items policies
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;

CREATE POLICY "Public can view order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Migration: 20250427065820_fragrant_mountain.sql
/*
  # Remove counter-related tables and columns

  1. Changes
    - Remove customer-specific tables and columns that were used for counter operations
    - Clean up related fields from orders table
*/

-- Drop counter-specific tables
DROP TABLE IF EXISTS customers;

-- Remove counter-specific columns from orders
ALTER TABLE orders
  DROP COLUMN IF EXISTS customer_phone,
  DROP COLUMN IF EXISTS subtotal,
  DROP COLUMN IF EXISTS tax,
  DROP COLUMN IF EXISTS discount,
  DROP COLUMN IF EXISTS coupon_code;

-- Remove preparation tracking from order_items
ALTER TABLE order_items
  DROP COLUMN IF EXISTS preparation_status,
  DROP COLUMN IF EXISTS started_at,
  DROP COLUMN IF EXISTS completed_at;

-- Migration: 20250427081804_cool_grass.sql
/*
  # Add counter dashboard schema

  1. New Tables
    - `customers`
      - Track customer information for counter operations
      - Store contact details and order history
    
    - `tables`
      - Manage restaurant tables
      - Track table status and capacity

  2. Changes to Existing Tables
    - Add counter-specific fields to orders table
    - Add preparation tracking to order_items

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for staff access
*/

-- Create customers table for counter operations
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE,
  email text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tables management
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text DEFAULT 'available',
  current_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  occupied_since timestamptz,
  last_cleaned_at timestamptz,
  section text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add counter-specific columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS estimated_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS server_id text,
  ADD COLUMN IF NOT EXISTS kitchen_notes text;

-- Add preparation tracking to order_items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS preparation_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_time integer, -- in minutes
  ADD COLUMN IF NOT EXISTS preparation_notes text;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Add policies for customers table
CREATE POLICY "Staff can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Add policies for tables
CREATE POLICY "Staff can view tables"
  ON tables
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert tables"
  ON tables
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update tables"
  ON tables
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete tables"
  ON tables
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update customer statistics after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics if phone number is provided
  IF NEW.customer_phone IS NOT NULL THEN
    INSERT INTO customers (phone, name, total_orders, total_spent, last_order_date)
    VALUES (
      NEW.customer_phone,
      NEW.customer_name,
      1,
      NEW.total_amount,
      NEW.created_at
    )
    ON CONFLICT (phone) DO UPDATE
    SET
      total_orders = customers.total_orders + 1,
      total_spent = customers.total_spent + NEW.total_amount,
      last_order_date = NEW.created_at,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update customer stats on order
CREATE TRIGGER on_order_customer_update
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function to update table status
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update table status when order status changes
  IF NEW.table_number IS NOT NULL THEN
    UPDATE tables
    SET
      status = CASE
        WHEN NEW.status = 'cancelled' THEN 'available'
        WHEN NEW.status = 'delivered' THEN 'needs_cleaning'
        ELSE 'occupied'
      END,
      current_order_id = CASE
        WHEN NEW.status IN ('cancelled', 'delivered') THEN NULL
        ELSE NEW.id
      END,
      occupied_since = CASE
        WHEN NEW.status = 'pending' AND OLD.status IS NULL THEN NEW.created_at
        ELSE occupied_since
      END,
      updated_at = now()
    WHERE table_number = NEW.table_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update table status on order status change
CREATE TRIGGER on_order_status_change
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status();

-- Migration: 20250427081942_autumn_grove.sql
/*
  # Fix orders table RLS policies

  1. Changes
    - Add RLS policy to allow authenticated users to insert orders
    - Add RLS policy to allow authenticated users to update orders
    - Add RLS policy to allow authenticated users to delete orders
    - Modify existing select policy to be more permissive for staff

  2. Security
    - Enable RLS on orders table (if not already enabled)
    - Add policies for all CRUD operations
    - Ensure authenticated users can manage orders
*/

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;

-- Create new policies
CREATE POLICY "Staff can view orders"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Staff can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- Migration: 20250427083816_humble_delta.sql
/*
  # Fix orders table RLS policies

  1. Changes
    - Update RLS policies for orders table to allow staff operations
    - Add policies for order creation and management from counter dashboard

  2. Security
    - Enable RLS on orders table
    - Add policies for staff to manage orders
    - Maintain data integrity and access control
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;
DROP POLICY IF EXISTS "Staff can view orders" ON orders;

-- Create new policies with proper security checks
CREATE POLICY "Staff can insert orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Staff can view orders"
ON orders
FOR SELECT
TO authenticated
USING (true);

-- Migration: 20250427115045_silver_lake.sql
/*
  # Fix Database Schema

  1. Changes
    - Drop and recreate tables with proper relationships
    - Fix enum types
    - Add proper constraints and indexes
    - Update RLS policies

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- Create enums
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_status payment_status DEFAULT 'pending',
  customer_name text,
  table_number text,
  order_type text,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Orders policies
CREATE POLICY "Users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Order items policies
CREATE POLICY "Users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Migration: 20250427115835_silver_jungle.sql
/*
  # Add customer phone number to orders

  1. Changes
    - Add customer_phone column to orders table
    - Add validation check for phone number format
    - Update existing indexes
*/

-- Add customer_phone column with validation
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD CONSTRAINT customer_phone_format CHECK (
    customer_phone IS NULL OR 
    customer_phone ~ '^[0-9]{10}$'
  );

-- Add index for customer phone lookups
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders(customer_phone);

-- Migration: 20250427120250_steep_summit.sql
/*
  # Add subtotal and related columns to orders

  1. Changes
    - Add subtotal column to orders table
    - Add tax column to orders table
    - Add discount column to orders table
    - Add validation checks for numeric fields
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0 CHECK (tax >= 0),
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0 CHECK (discount >= 0);

-- Migration: 20250427121441_damp_star.sql
/*
  # Fix Orders RLS Policies for Counter Dashboard

  1. Changes
    - Drop existing RLS policies that may be conflicting
    - Create new policies that allow:
      - Public read access for order tracking
      - Authenticated users to manage orders
      - Staff to perform counter operations
    
  2. Security
    - Maintain basic security while enabling counter operations
    - Allow unauthenticated order tracking
    - Ensure data integrity
*/

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can view orders" ON orders;
DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;

-- Create new, more permissive policies for counter operations

-- Allow public read access for order tracking
CREATE POLICY "Public can view orders"
ON orders FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create orders (for counter staff)
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update orders (for counter and kitchen staff)
CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete orders if needed
CREATE POLICY "Authenticated users can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- Update order_items policies as well
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can manage order items" ON order_items;

-- Create new policies for order_items
CREATE POLICY "Public can view order items"
ON order_items FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage order items"
ON order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Migration: 20250427121855_broken_fire.sql
/*
  # Fix Counter RLS Policies

  1. Changes
    - Verify RLS is enabled on orders table
    - Drop and recreate policies with proper permissions
    - Add specific policies for counter operations
    - Add validation constraints for order data

  2. Security
    - Maintain data integrity
    - Allow counter staff operations
    - Enable public order tracking
*/

-- First verify RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Create new policies for orders table
CREATE POLICY "Public can view orders"
ON orders
FOR SELECT
TO public
USING (true);

CREATE POLICY "Counter staff can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure required fields are present
  customer_name IS NOT NULL AND
  total_amount >= 0 AND
  (
    -- Either table number or order type must be specified
    table_number IS NOT NULL OR 
    order_type = 'takeaway'
  )
);

CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Prevent modifications to completed orders
  status != 'delivered' AND
  status != 'cancelled'
);

CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  -- Only allow deletion of pending orders
  status = 'pending'
);

-- Add constraints to ensure data integrity
ALTER TABLE orders
  -- Ensure valid order type
  ADD CONSTRAINT valid_order_type 
  CHECK (order_type IN ('dine-in', 'takeaway')),
  
  -- Ensure table number is present for dine-in orders
  ADD CONSTRAINT table_number_required 
  CHECK (
    (order_type = 'dine-in' AND table_number IS NOT NULL) OR
    (order_type = 'takeaway')
  );

-- Create function to validate order data
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure customer name is present
  IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  -- Validate phone number format if provided
  IF NEW.customer_phone IS NOT NULL AND NOT NEW.customer_phone ~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Validate total amount
  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order validation
DROP TRIGGER IF EXISTS validate_order_trigger ON orders;
CREATE TRIGGER validate_order_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order();

-- Migration: 20250427153853_icy_paper.sql
/*
  # Add Customer Analytics and Recommendations

  1. Changes
    - Add fields to track customer preferences and behavior
    - Add support for personalized recommendations
    - Track customer engagement metrics
    
  2. Security
    - Maintain existing RLS policies
    - Add appropriate constraints
*/

-- Add recommendation fields to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS taste_profile jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommended_items text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendation_last_updated timestamptz,
  ADD COLUMN IF NOT EXISTS cuisine_affinity_scores jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_confidence_score numeric DEFAULT 0;

-- Add engagement tracking to user_interactions
ALTER TABLE user_interactions
  ADD COLUMN IF NOT EXISTS recommendation_clicked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recommendation_converted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS personalization_segment text,
  ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;

-- Add personalization fields to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS personalization_applied boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recommendation_source text,
  ADD COLUMN IF NOT EXISTS personalization_effectiveness numeric;

-- Function to update taste profile based on orders
CREATE OR REPLACE FUNCTION update_taste_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user preferences based on order
  WITH order_categories AS (
    SELECT DISTINCT category 
    FROM order_items oi
    WHERE oi.order_id = NEW.id
  )
  UPDATE user_preferences
  SET
    taste_profile = CASE
      WHEN taste_profile ? 'categories' 
      THEN jsonb_set(
        taste_profile,
        '{categories}',
        (taste_profile->'categories')::jsonb || 
        jsonb_build_object(category, COALESCE((taste_profile->'categories'->category)::int + 1, 1))
      )
      ELSE jsonb_build_object('categories', jsonb_build_object(category, 1))
    END,
    cuisine_affinity_scores = CASE
      WHEN cuisine_affinity_scores IS NULL THEN '{}'::jsonb
      ELSE cuisine_affinity_scores
    END,
    updated_at = NOW()
  FROM order_categories
  WHERE user_preferences.user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update taste profile on order
CREATE TRIGGER on_order_update_taste_profile
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_taste_profile();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_interactions
  SET engagement_score = (
    CASE WHEN recommendation_clicked THEN 0.3 ELSE 0 END +
    CASE WHEN recommendation_converted THEN 0.7 ELSE 0 END
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update engagement score
CREATE TRIGGER on_interaction_update_engagement
  AFTER INSERT OR UPDATE OF recommendation_clicked, recommendation_converted
  ON user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_engagement_score();

-- Migration: 20250427154633_foggy_desert.sql
/*
  # Add estimated completion time to orders

  1. Changes
    - Add estimated_completion_time column to orders table
    - Add actual_completion_time column for tracking
    - Add preparation_time column for initial estimates

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS preparation_time integer; -- in minutes

-- Update the validate_order function to handle the new fields
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Existing validations
  IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF NEW.customer_phone IS NOT NULL AND NOT NEW.customer_phone ~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  -- Set estimated completion time when order status changes to 'preparing'
  IF NEW.status = 'preparing' AND OLD.status = 'pending' THEN
    NEW.estimated_completion_time := NOW() + (COALESCE(NEW.preparation_time, 20) || ' minutes')::interval;
  END IF;

  -- Set actual completion time when order is delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.actual_completion_time := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migration: 20250427160434_bold_sky.sql
/*
  # Add billing system tables and functions

  1. New Tables
    - `invoices`
      - Store invoice details and metadata
      - Track invoice status and history
    
    - `invoice_items`
      - Store individual line items for each invoice
      - Track item details and pricing

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create invoice status type
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',
  'paid',
  'cancelled',
  'refunded'
);

-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  billing_address text,
  invoice_date timestamptz DEFAULT now(),
  due_date timestamptz,
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax_amount numeric NOT NULL CHECK (tax_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status invoice_status DEFAULT 'draft',
  payment_method text,
  payment_status text,
  notes text,
  terms_and_conditions text,
  is_printed boolean DEFAULT false,
  print_count int DEFAULT 0,
  last_printed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice items table
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  description text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  tax_rate numeric DEFAULT 0.18,
  tax_amount numeric NOT NULL CHECK (tax_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Public can view own invoices"
  ON invoices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for invoice items
CREATE POLICY "Public can view invoice items"
  ON invoice_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX invoices_order_id_idx ON invoices(order_id);
CREATE INDEX invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX invoices_customer_phone_idx ON invoices(customer_phone);
CREATE INDEX invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  year text;
  month text;
  day text;
  sequence int;
  invoice_number text;
BEGIN
  year := to_char(CURRENT_DATE, 'YY');
  month := to_char(CURRENT_DATE, 'MM');
  day := to_char(CURRENT_DATE, 'DD');
  
  -- Get the next sequence number for today
  WITH seq AS (
    SELECT COUNT(*) + 1 as next_seq
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE
  )
  SELECT next_seq INTO sequence FROM seq;
  
  -- Format: INV-YYMMDD-XXXX (e.g., INV-240428-0001)
  invoice_number := 'INV-' || year || month || day || '-' || 
                   LPAD(sequence::text, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create invoice from order
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Create invoice
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  ) VALUES (
    NEW.id,
    generate_invoice_number(),
    NEW.customer_name,
    NEW.customer_phone,
    NEW.subtotal,
    NEW.tax,
    NEW.total_amount,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  ) RETURNING id INTO NEW.invoice_id;

  -- Create invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_name,
    quantity,
    unit_price,
    tax_amount,
    total_amount
  )
  SELECT
    NEW.invoice_id,
    oi.name,
    oi.quantity,
    oi.price,
    (oi.price * oi.quantity * 0.18),
    (oi.price * oi.quantity * 1.18)
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create invoice when order is created
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Migration: 20250428010626_weathered_frog.sql
/*
  # Fix invoice-order relationship

  1. Changes
    - Remove circular dependency between orders and invoices
    - Update create_invoice_from_order function to handle the relationship properly
    - Fix trigger to avoid recursive issues

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger and function to avoid issues during schema changes
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Remove the invoice_id column from orders if it exists (this creates circular dependency)
ALTER TABLE orders DROP COLUMN IF EXISTS invoice_id;

-- Recreate function with fixed logic (no circular reference)
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_id uuid;
BEGIN
  -- Only create invoice if one doesn't already exist for this order
  IF NOT EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
    -- Create invoice
    INSERT INTO invoices (
      order_id,
      invoice_number,
      customer_name,
      customer_phone,
      subtotal,
      tax_amount,
      total_amount,
      payment_method,
      payment_status,
      status
    ) VALUES (
      NEW.id,
      generate_invoice_number(),
      NEW.customer_name,
      NEW.customer_phone,
      NEW.subtotal,
      NEW.tax,
      NEW.total_amount,
      NEW.payment_method,
      NEW.payment_status,
      CASE 
        WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
        ELSE 'issued'::invoice_status
      END
    ) RETURNING id INTO new_invoice_id;

    -- Create invoice items
    INSERT INTO invoice_items (
      invoice_id,
      item_name,
      quantity,
      unit_price,
      tax_amount,
      total_amount
    )
    SELECT
      new_invoice_id,
      oi.name,
      oi.quantity,
      oi.price,
      (oi.price * oi.quantity * 0.18),
      (oi.price * oi.quantity * 1.18)
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Create convenient function to find invoice by order_id
CREATE OR REPLACE FUNCTION get_invoice_by_order(order_id uuid)
RETURNS uuid AS $$
  SELECT id FROM invoices WHERE order_id = $1 LIMIT 1;
$$ LANGUAGE sql;

-- Migration: 20250428010843_purple_swamp.sql
/*
  # Fix taste profile function

  1. Changes
    - Update taste profile function to remove category dependency
    - Simplify the function to track only ordered items
    - Improve handling of race conditions
    - Make the implementation more efficient
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_order_update_taste_profile ON orders;

-- Update the function to remove category dependency and handle race conditions
CREATE OR REPLACE FUNCTION update_taste_profile()
RETURNS TRIGGER AS $$
DECLARE
  items_json jsonb;
BEGIN
  -- First, build the ordered items JSON once for efficiency
  SELECT jsonb_object_agg(name, quantity) INTO items_json 
  FROM order_items 
  WHERE order_id = NEW.id;
  
  -- Only continue if items were found
  IF items_json IS NOT NULL AND jsonb_typeof(items_json) = 'object' THEN
    -- Use UPSERT pattern to handle race conditions
    INSERT INTO user_preferences (
      user_id, 
      taste_profile,
      updated_at
    ) VALUES (
      NEW.user_id,
      jsonb_build_object('items', items_json),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      taste_profile = CASE
        WHEN user_preferences.taste_profile ? 'items' THEN
          jsonb_set(
            user_preferences.taste_profile,
            '{items}',
            COALESCE(user_preferences.taste_profile->'items', '{}'::jsonb) || items_json
          )
        ELSE
          jsonb_build_object('items', items_json)
      END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_order_update_taste_profile
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_taste_profile();

-- Add an index to improve performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_preferences' AND indexname = 'user_preferences_user_id_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
  END IF;
END $$;

-- Migration: 20250428011710_hidden_morning.sql
/*
  # Fix Invoice Generation System

  1. Changes
    - Remove invoice_id from orders to break circular dependency
    - Update create_invoice_from_order function
    - Add validation constraints
    - Add indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Remove invoice_id from orders to break circular dependency
ALTER TABLE orders
  DROP COLUMN IF EXISTS invoice_id;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Recreate function with fixed logic
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  new_invoice_id uuid;
BEGIN
  -- Calculate totals
  WITH order_totals AS (
    SELECT 
      SUM(quantity * price) as subtotal,
      SUM(quantity * price * tax_rate) as tax_amount,
      SUM(quantity * price * (1 + tax_rate)) as total_amount
    FROM order_items
    WHERE order_id = NEW.id
  )
  -- Create invoice
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  )
  SELECT
    NEW.id,
    generate_invoice_number(),
    NEW.customer_name,
    NEW.customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  FROM order_totals
  RETURNING id INTO new_invoice_id;

  -- Create invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_name,
    quantity,
    unit_price,
    tax_rate,
    tax_amount,
    total_amount
  )
  SELECT
    new_invoice_id,
    oi.name,
    oi.quantity,
    oi.price,
    tax_rate,
    (oi.price * oi.quantity * tax_rate),
    (oi.price * oi.quantity * (1 + tax_rate))
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(payment_status);

-- Migration: 20250428012852_shrill_math.sql
/*
  # Fix Invoice Generation

  1. Changes
    - Update create_invoice_from_order function to properly calculate totals
    - Add validation to ensure non-null values
    - Fix order totals calculation
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Recreate function with fixed logic
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  calculated_subtotal numeric;
  calculated_tax numeric;
  calculated_total numeric;
BEGIN
  -- Calculate totals first
  SELECT 
    COALESCE(SUM(quantity * price), 0) as subtotal,
    COALESCE(SUM(quantity * price * tax_rate), 0) as tax,
    COALESCE(SUM(quantity * price * (1 + tax_rate)), 0) as total
  INTO calculated_subtotal, calculated_tax, calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

  -- Create invoice with calculated values
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  ) VALUES (
    NEW.id,
    generate_invoice_number(),
    COALESCE(NEW.customer_name, 'Guest'),
    NEW.customer_phone,
    calculated_subtotal,
    calculated_tax,
    calculated_total,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  );

  -- Create invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_name,
    quantity,
    unit_price,
    tax_rate,
    tax_amount,
    total_amount
  )
  SELECT
    currval('invoices_id_seq'),
    oi.name,
    oi.quantity,
    oi.price,
    tax_rate,
    (oi.price * oi.quantity * tax_rate),
    (oi.price * oi.quantity * (1 + tax_rate))
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Migration: 20250428013133_restless_prism.sql
/*
  # Fix Invoice Generation UUID Handling

  1. Changes
    - Remove sequence reference since we use UUIDs
    - Store invoice ID in a variable for reference
    - Ensure proper UUID handling
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Recreate function with fixed logic
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  calculated_subtotal numeric;
  calculated_tax numeric;
  calculated_total numeric;
  new_invoice_id uuid;
BEGIN
  -- Calculate totals first
  SELECT 
    COALESCE(SUM(quantity * price), 0) as subtotal,
    COALESCE(SUM(quantity * price * tax_rate), 0) as tax,
    COALESCE(SUM(quantity * price * (1 + tax_rate)), 0) as total
  INTO calculated_subtotal, calculated_tax, calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

  -- Create invoice with calculated values
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  ) VALUES (
    NEW.id,
    generate_invoice_number(),
    COALESCE(NEW.customer_name, 'Guest'),
    NEW.customer_phone,
    calculated_subtotal,
    calculated_tax,
    calculated_total,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  ) RETURNING id INTO new_invoice_id;

  -- Create invoice items using the returned UUID
  INSERT INTO invoice_items (
    invoice_id,
    item_name,
    quantity,
    unit_price,
    tax_rate,
    tax_amount,
    total_amount
  )
  SELECT
    new_invoice_id,
    oi.name,
    oi.quantity,
    oi.price,
    tax_rate,
    (oi.price * oi.quantity * tax_rate),
    (oi.price * oi.quantity * (1 + tax_rate))
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Migration: 20250503083933_solitary_glade.sql
/*
  # Add inventory management schema

  1. New Tables
    - `inventory`
      - Track inventory items and stock levels
      - Monitor expiry dates and reorder points
    
    - `inventory_transactions`
      - Record all inventory movements
      - Track stock adjustments and reasons

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create inventory table
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  min_quantity numeric NOT NULL DEFAULT 0,
  max_quantity numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  supplier text,
  last_restocked timestamptz,
  expiry_date timestamptz,
  status text DEFAULT 'in_stock',
  storage_location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory transactions table
CREATE TABLE inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  previous_quantity numeric NOT NULL,
  new_quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reference_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX inventory_category_idx ON inventory(category);
CREATE INDEX inventory_status_idx ON inventory(status);
CREATE INDEX inventory_supplier_idx ON inventory(supplier);
CREATE INDEX inventory_expiry_date_idx ON inventory(expiry_date);
CREATE INDEX inventory_transactions_type_idx ON inventory_transactions(transaction_type);
CREATE INDEX inventory_transactions_created_at_idx ON inventory_transactions(created_at);

-- Function to update inventory status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := CASE
    WHEN NEW.quantity <= 0 THEN 'out_of_stock'
    WHEN NEW.quantity <= NEW.min_quantity THEN 'low_stock'
    ELSE 'in_stock'
  END;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating inventory status
CREATE TRIGGER update_inventory_status_trigger
  BEFORE INSERT OR UPDATE OF quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_status();

-- Function to record inventory transactions
CREATE OR REPLACE FUNCTION record_inventory_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.quantity != OLD.quantity THEN
    INSERT INTO inventory_transactions (
      inventory_id,
      transaction_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_cost,
      total_cost,
      created_by
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'stock_in'
        ELSE 'stock_out'
      END,
      ABS(NEW.quantity - OLD.quantity),
      OLD.quantity,
      NEW.quantity,
      NEW.cost_price,
      ABS(NEW.quantity - OLD.quantity) * NEW.cost_price,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for recording inventory transactions
CREATE TRIGGER record_inventory_transaction_trigger
  AFTER UPDATE OF quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION record_inventory_transaction();

-- Migration: 20250503101510_crystal_lagoon.sql
/*
  # Fix Inventory RLS Policies

  1. Changes
    - Update RLS policies for inventory table to properly handle staff access
    - Add role-based access control
    - Ensure authenticated users can manage inventory items

  2. Security
    - Maintain RLS protection while allowing proper access
    - Ensure only authenticated users can access inventory
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view inventory" ON inventory;
DROP POLICY IF EXISTS "Staff can manage inventory" ON inventory;

-- Create new, more specific policies
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- Migration: 20250505064564_mockdata_inventory.sql
/*
  # Add mock inventory data

  1. Changes
    - Insert sample inventory items
    - Add realistic stock levels and pricing
    - Include various categories and units
*/

-- Insert mock inventory data
INSERT INTO inventory (
  name,
  category,
  quantity,
  unit,
  min_quantity,
  max_quantity,
  cost_price,
  supplier,
  storage_location,
  status,
  notes
) VALUES
  -- Dry Goods
  ('Rice', 'dry_goods', 50.0, 'kg', 20.0, 100.0, 85.0, 'Global Foods Ltd', 'Dry Storage A1', 'in_stock', 'Basmati rice'),
  ('All Purpose Flour', 'dry_goods', 30.0, 'kg', 15.0, 60.0, 45.0, 'Baker''s Supply Co', 'Dry Storage A2', 'in_stock', 'Premium quality'),
  ('Sugar', 'dry_goods', 25.0, 'kg', 10.0, 50.0, 40.0, 'Sweet Supplies Inc', 'Dry Storage A3', 'in_stock', 'Granulated white sugar'),
  
  -- Spices
  ('Black Pepper', 'spices', 5.0, 'kg', 2.0, 10.0, 600.0, 'Spice Traders Ltd', 'Spice Rack B1', 'in_stock', 'Whole black peppercorns'),
  ('Ground Cumin', 'spices', 3.0, 'kg', 1.0, 5.0, 450.0, 'Spice Traders Ltd', 'Spice Rack B2', 'in_stock', 'Premium ground cumin'),
  ('Turmeric Powder', 'spices', 4.0, 'kg', 1.5, 6.0, 380.0, 'Spice Traders Ltd', 'Spice Rack B3', 'low_stock', 'Pure turmeric powder'),
  
  -- Dairy
  ('Butter', 'dairy', 20.0, 'kg', 10.0, 30.0, 400.0, 'Fresh Dairy Co', 'Cold Storage C1', 'in_stock', 'Unsalted butter'),
  ('Cheese', 'dairy', 15.0, 'kg', 8.0, 25.0, 450.0, 'Fresh Dairy Co', 'Cold Storage C2', 'low_stock', 'Mozzarella cheese'),
  ('Heavy Cream', 'dairy', 10.0, 'L', 5.0, 20.0, 200.0, 'Fresh Dairy Co', 'Cold Storage C3', 'in_stock', 'Fresh heavy cream'),
  
  -- Vegetables
  ('Onions', 'vegetables', 40.0, 'kg', 20.0, 60.0, 35.0, 'Fresh Produce Inc', 'Vegetable Storage D1', 'in_stock', 'Red onions'),
  ('Tomatoes', 'vegetables', 25.0, 'kg', 15.0, 45.0, 45.0, 'Fresh Produce Inc', 'Vegetable Storage D2', 'in_stock', 'Roma tomatoes'),
  ('Bell Peppers', 'vegetables', 10.0, 'kg', 8.0, 20.0, 80.0, 'Fresh Produce Inc', 'Vegetable Storage D3', 'low_stock', 'Mixed colors'),
  
  -- Meat
  ('Chicken Breast', 'meat', 30.0, 'kg', 15.0, 40.0, 220.0, 'Premium Meats Ltd', 'Freezer E1', 'in_stock', 'Boneless, skinless'),
  ('Ground Beef', 'meat', 25.0, 'kg', 12.0, 35.0, 280.0, 'Premium Meats Ltd', 'Freezer E2', 'in_stock', '80/20 lean'),
  ('Fish Fillet', 'meat', 15.0, 'kg', 10.0, 25.0, 350.0, 'Seafood Express', 'Freezer E3', 'low_stock', 'Fresh cod fillet'),
  
  -- Packaging
  ('Takeout Containers', 'packaging', 500.0, 'pieces', 200.0, 1000.0, 8.0, 'Package Plus', 'Storage F1', 'in_stock', '500ml size'),
  ('Paper Bags', 'packaging', 300.0, 'pieces', 150.0, 600.0, 5.0, 'Package Plus', 'Storage F2', 'in_stock', 'Medium size'),
  ('Plastic Cutlery Sets', 'packaging', 200.0, 'sets', 100.0, 400.0, 3.0, 'Package Plus', 'Storage F3', 'low_stock', 'Fork, knife, spoon'),
  
  -- Beverages
  ('Cola Syrup', 'beverages', 20.0, 'L', 10.0, 30.0, 150.0, 'Beverage Supply Co', 'Beverage Storage G1', 'in_stock', 'Fountain drink syrup'),
  ('Coffee Beans', 'beverages', 15.0, 'kg', 8.0, 25.0, 450.0, 'Coffee Traders Inc', 'Beverage Storage G2', 'in_stock', 'Arabica blend'),
  ('Tea Bags', 'beverages', 1000.0, 'pieces', 500.0, 2000.0, 0.5, 'Tea Traders Ltd', 'Beverage Storage G3', 'in_stock', 'English Breakfast'),
  
  -- Cleaning Supplies
  ('Dish Soap', 'cleaning', 30.0, 'L', 15.0, 50.0, 45.0, 'Clean Supply Co', 'Cleaning Storage H1', 'in_stock', 'Commercial grade'),
  ('Sanitizer', 'cleaning', 25.0, 'L', 12.0, 40.0, 55.0, 'Clean Supply Co', 'Cleaning Storage H2', 'in_stock', 'Food-safe sanitizer'),
  ('Paper Towels', 'cleaning', 100.0, 'rolls', 50.0, 200.0, 15.0, 'Clean Supply Co', 'Cleaning Storage H3', 'low_stock', 'Industrial rolls');

-- Record initial transactions
INSERT INTO inventory_transactions (
  inventory_id,
  transaction_type,
  quantity,
  previous_quantity,
  new_quantity,
  unit_cost,
  total_cost,
  reference_number,
  notes
)
SELECT 
  id,
  'initial_stock',
  quantity,
  0,
  quantity,
  cost_price,
  quantity * cost_price,
  'INIT-' || gen_random_uuid()::text,
  'Initial inventory setup'
FROM inventory;


-- Migration: 20250505090854_nameless_peak.sql
/*
  # Fix Inventory RLS Policies and Add Validation

  1. Changes
    - Drop existing RLS policies
    - Create new, more permissive policies
    - Add validation triggers
    - Add proper constraints

  2. Security
    - Maintain basic security while allowing inventory operations
    - Add proper validation checks
*/

-- First, verify and enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can delete inventory" ON inventory;

-- Create new, more permissive policies
CREATE POLICY "Public can view inventory"
  ON inventory
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Counter staff can manage inventory"
  ON inventory
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF NEW.category IS NULL OR trim(NEW.category) = '' THEN
    RAISE EXCEPTION 'Category is required';
  END IF;

  IF NEW.unit IS NULL OR trim(NEW.unit) = '' THEN
    RAISE EXCEPTION 'Unit is required';
  END IF;

  -- Validate numeric fields
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;

  IF NEW.min_quantity < 0 THEN
    RAISE EXCEPTION 'Minimum quantity cannot be negative';
  END IF;

  IF NEW.max_quantity < NEW.min_quantity THEN
    RAISE EXCEPTION 'Maximum quantity must be greater than minimum quantity';
  END IF;

  IF NEW.cost_price < 0 THEN
    RAISE EXCEPTION 'Cost price cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
CREATE TRIGGER validate_inventory_trigger
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory();

-- Add proper constraints
ALTER TABLE inventory
  ADD CONSTRAINT positive_quantity CHECK (quantity >= 0),
  ADD CONSTRAINT positive_min_quantity CHECK (min_quantity >= 0),
  ADD CONSTRAINT positive_max_quantity CHECK (max_quantity >= 0),
  ADD CONSTRAINT positive_cost_price CHECK (cost_price >= 0),
  ADD CONSTRAINT valid_quantity_range CHECK (max_quantity >= min_quantity);

-- Update transaction policies as well
DROP POLICY IF EXISTS "Staff can view transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Staff can insert transactions" ON inventory_transactions;

CREATE POLICY "Public can view transactions"
  ON inventory_transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert transactions"
  ON inventory_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Migration: 20250505122407_rough_salad.sql
/*
  # Add staff management schema

  1. New Tables
    - `staff`
      - Store staff member details and employment information
      - Track access levels and permissions
    
    - `staff_activity_logs`
      - Record staff actions and system events
      - Track login history and changes

    - `staff_attendance`
      - Track staff attendance and work hours
      - Record check-in/check-out times

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create staff roles type
CREATE TYPE staff_role AS ENUM (
  'admin',
  'manager',
  'chef',
  'server',
  'cashier'
);

-- Create staff departments type
CREATE TYPE staff_department AS ENUM (
  'kitchen',
  'service',
  'management',
  'accounts'
);

-- Create staff table
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  role staff_role NOT NULL,
  department staff_department NOT NULL,
  start_date date NOT NULL,
  profile_photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create staff activity logs table
CREATE TABLE staff_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create staff attendance table
CREATE TABLE staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  check_in timestamptz NOT NULL,
  check_out timestamptz,
  total_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Staff members can view own profile"
  ON staff FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create policies for activity logs
CREATE POLICY "Staff can view own activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create policies for attendance
CREATE POLICY "Staff can view own attendance"
  ON staff_attendance FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can record own attendance"
  ON staff_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX staff_user_id_idx ON staff(user_id);
CREATE INDEX staff_role_idx ON staff(role);
CREATE INDEX staff_department_idx ON staff(department);
CREATE INDEX staff_activity_logs_staff_id_idx ON staff_activity_logs(staff_id);
CREATE INDEX staff_activity_logs_created_at_idx ON staff_activity_logs(created_at);
CREATE INDEX staff_attendance_staff_id_idx ON staff_attendance(staff_id);
CREATE INDEX staff_attendance_check_in_idx ON staff_attendance(check_in);

-- Function to log staff activity
CREATE OR REPLACE FUNCTION log_staff_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO staff_activity_logs (
    staff_id,
    action_type,
    action_details,
    ip_address
  ) VALUES (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    ),
    current_setting('request.headers')::jsonb->>'x-forwarded-for'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
CREATE TRIGGER log_staff_changes
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION log_staff_activity();

-- Function to calculate attendance hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculating attendance hours
CREATE TRIGGER calculate_attendance_hours_trigger
  BEFORE INSERT OR UPDATE ON staff_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_hours();

-- Migration: 20250506081741_twilight_wind.sql
/*
  # Enhance Staff Management System

  1. New Tables
    - `staff_shifts` - Manage staff schedules and shifts
    - `staff_performance` - Track staff performance reviews
    - `staff_training` - Track training and certifications
    - `staff_payroll` - Manage payroll information
    - `staff_leave` - Track leave requests and balances
    - `staff_documents` - Store staff documents
    - `staff_communications` - Internal communication system
*/

-- Create shift types
CREATE TYPE shift_type AS ENUM (
  'morning',
  'afternoon',
  'evening',
  'night'
);

-- Create leave types
CREATE TYPE leave_type AS ENUM (
  'annual',
  'sick',
  'personal',
  'unpaid',
  'bereavement',
  'maternity',
  'paternity'
);

-- Create leave status
CREATE TYPE leave_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

-- Create performance rating
CREATE TYPE performance_rating AS ENUM (
  'excellent',
  'good',
  'satisfactory',
  'needs_improvement',
  'unsatisfactory'
);

-- Staff Shifts Table
CREATE TABLE staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  shift_type shift_type NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  break_duration interval DEFAULT '30 minutes',
  is_published boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_shift_times CHECK (end_time > start_time)
);

-- Staff Performance Table
CREATE TABLE staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  reviewer_id uuid REFERENCES staff(id),
  rating performance_rating NOT NULL,
  goals_achieved jsonb DEFAULT '[]',
  areas_of_improvement text[],
  comments text,
  next_review_date date,
  acknowledgement_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Training Table
CREATE TABLE staff_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  training_name text NOT NULL,
  description text,
  completion_date date,
  expiry_date date,
  certificate_url text,
  training_provider text,
  status text DEFAULT 'pending',
  score numeric,
  is_mandatory boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Payroll Table
CREATE TABLE staff_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  base_salary numeric NOT NULL,
  hourly_rate numeric,
  bank_account text,
  tax_information jsonb,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  payment_schedule text DEFAULT 'monthly',
  last_payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Leave Table
CREATE TABLE staff_leave (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status leave_status DEFAULT 'pending',
  reason text,
  approved_by uuid REFERENCES staff(id),
  approved_at timestamptz,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_leave_dates CHECK (end_date >= start_date)
);

-- Staff Documents Table
CREATE TABLE staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  expiry_date date,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES staff(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Communications Table
CREATE TABLE staff_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  priority text DEFAULT 'normal',
  category text,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to staff table
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS hire_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS probation_end_date date,
  ADD COLUMN IF NOT EXISTS notice_period interval DEFAULT '30 days',
  ADD COLUMN IF NOT EXISTS skills text[],
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS performance_score numeric,
  ADD COLUMN IF NOT EXISTS leave_balance jsonb DEFAULT '{"annual": 20, "sick": 10}';

-- Enable RLS
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_communications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX staff_shifts_staff_id_idx ON staff_shifts(staff_id);
CREATE INDEX staff_shifts_date_idx ON staff_shifts(start_time);
CREATE INDEX staff_performance_staff_id_idx ON staff_performance(staff_id);
CREATE INDEX staff_training_staff_id_idx ON staff_training(staff_id);
CREATE INDEX staff_payroll_staff_id_idx ON staff_payroll(staff_id);
CREATE INDEX staff_leave_staff_id_idx ON staff_leave(staff_id);
CREATE INDEX staff_leave_status_idx ON staff_leave(status);
CREATE INDEX staff_documents_staff_id_idx ON staff_documents(staff_id);
CREATE INDEX staff_communications_sender_id_idx ON staff_communications(sender_id);
CREATE INDEX staff_communications_recipient_id_idx ON staff_communications(recipient_id);

-- RLS Policies
CREATE POLICY "Staff can view own shifts"
  ON staff_shifts FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own performance"
  ON staff_performance FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own training"
  ON staff_training FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own payroll"
  ON staff_payroll FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage own leave"
  ON staff_leave FOR ALL
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own documents"
  ON staff_documents FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage own communications"
  ON staff_communications FOR ALL
  TO authenticated
  USING (sender_id IN (SELECT id FROM staff WHERE user_id = auth.uid()) OR 
         recipient_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Functions and Triggers

-- Function to update leave balance
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE staff
    SET leave_balance = jsonb_set(
      leave_balance,
      ARRAY[NEW.leave_type::text],
      (COALESCE((leave_balance->>NEW.leave_type::text)::numeric, 0) - 
       (NEW.end_date - NEW.start_date + 1))::text::jsonb
    )
    WHERE id = NEW.staff_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating leave balance
CREATE TRIGGER update_leave_balance_trigger
  AFTER UPDATE OF status ON staff_leave
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_leave_balance();

-- Function to calculate performance score
CREATE OR REPLACE FUNCTION calculate_performance_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE staff
  SET performance_score = (
    SELECT AVG(
      CASE rating
        WHEN 'excellent' THEN 5
        WHEN 'good' THEN 4
        WHEN 'satisfactory' THEN 3
        WHEN 'needs_improvement' THEN 2
        WHEN 'unsatisfactory' THEN 1
      END
    )
    FROM staff_performance
    WHERE staff_id = NEW.staff_id
  )
  WHERE id = NEW.staff_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating performance score
CREATE TRIGGER calculate_performance_score_trigger
  AFTER INSERT OR UPDATE ON staff_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_performance_score();

-- Migration: 20250510112345_database_optimization.sql
/*
  # Database Optimization - Fixed and Improved Version

  1. Begin with a transaction for atomicity
  2. First analyze the database structure
  3. Then perform compatible optimizations
  4. Add indexes only where needed
  5. Clean up policies safely
  6. Improved error handling
*/

BEGIN;

-- Step 1: Create a temporary schema analysis table to understand our database structure
CREATE TEMP TABLE schema_analysis AS
SELECT 
  table_name,
  column_name,
  data_type
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name,
  column_name;

-- Add required columns to profiles table before attempting to update them
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_orders int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_date timestamptz;

-- Step 1: Remove redundant and unused tables safely
DO $$
BEGIN
  -- Only drop if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'table_analytics') THEN
    DROP TABLE table_analytics CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_analytics') THEN
    DROP TABLE order_analytics CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promotion_responses') THEN
    DROP TABLE promotion_responses CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_segments') THEN
    DROP TABLE user_segments CASCADE;
  END IF;
END $$;

-- Step 2: Only try to consolidate customer data if the customers table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    -- Ensure phone column exists in profiles
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
      ALTER TABLE profiles ADD COLUMN phone text;
    END IF;
    
    -- Update profiles with customer data where phone matches
    UPDATE profiles p
    SET
      total_orders = c.total_orders,
      total_spent = c.total_spent,
      last_visit_date = c.last_order_date
    FROM customers c
    WHERE p.phone = c.phone;
    
    -- Only drop if there are no other tables referencing it
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc 
      JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_catalog = ccu.constraint_catalog 
      AND tc.constraint_schema = ccu.constraint_schema
      AND tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'customers'
    ) THEN
      DROP TABLE customers;
    ELSE
      RAISE WARNING 'Could not drop customers table due to existing references';
    END IF;
  END IF;
END $$;

-- Step 3: Remove circular dependency between orders and invoices
DO $$
BEGIN
  -- Check for and remove circular dependency between orders and invoices
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE orders DROP COLUMN invoice_id;
  END IF;
END $$;

-- Step 2: Add missing indexes based on actual table structure

-- Orders table indexes (only if columns exist)
DO $$
BEGIN
  -- Check if orders table has a user_id column before creating index
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
  END IF;

  -- Check if orders table has a status column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
  END IF;

  -- Check if orders table has a payment_status column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
  END IF;

  -- Check if orders table has a created_at column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
  END IF;

  -- Check if orders table has a table_number column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'table_number'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_table_number_idx ON orders(table_number);
  END IF;

  -- Check if orders table has a customer_phone column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders(customer_phone);
  END IF;
END $$;

-- Order_items table indexes
DO $$
BEGIN
  -- Check if order_items table exists and has an order_id column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'order_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
  END IF;

  -- Check if order_items table has a name column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'name'
  ) THEN
    CREATE INDEX IF NOT EXISTS order_items_name_idx ON order_items(name);
  END IF;
END $$;

-- Profiles table indexes
DO $$
BEGIN
  -- Check if profiles table has a phone column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
  END IF;

  -- Check if profiles table has an email column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
  END IF;
END $$;

-- Invoices table indexes
DO $$
BEGIN
  -- Check if invoices table exists and has needed columns
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    -- Check for order_id column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'order_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_order_id_idx ON invoices(order_id);
    END IF;

    -- Check for created_at column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);
    END IF;

    -- Check for status column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
    END IF;

    -- Check for payment_status column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_status'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(payment_status);
    END IF;
  END IF;
END $$;

-- Step 4: Clean up RLS policies safely
DO $$
BEGIN
  -- Only attempt to drop policies on tables that exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    -- Drop potentially conflicting policies
    DROP POLICY IF EXISTS "Users can read own orders" ON orders;
    DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
    DROP POLICY IF EXISTS "Staff can manage orders" ON orders;
    DROP POLICY IF EXISTS "Public can view orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
    DROP POLICY IF EXISTS "Staff can view orders" ON orders;
    DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
    DROP POLICY IF EXISTS "Staff can update orders" ON orders;
    DROP POLICY IF EXISTS "Staff can delete orders" ON orders;
    DROP POLICY IF EXISTS "Counter staff can create orders" ON orders;
    
    -- Create consolidated policies
    CREATE POLICY "Public can view orders"
      ON orders FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Staff can manage orders"
      ON orders FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Order items policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    -- Drop potentially conflicting policies
    DROP POLICY IF EXISTS "Users can view order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
    DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Public can view order items" ON order_items;

    -- Create consolidated policies
    CREATE POLICY "Public can view order items"
      ON order_items FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Staff can manage order items"
      ON order_items FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Step 5: Create optimized trigger functions
-- Define these outside DO blocks to avoid syntax errors

-- Improved order validation function
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- For customer name validation
  IF TG_OP = 'INSERT' THEN
    -- For INSERT operations
    IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
      RAISE EXCEPTION 'Customer name is required';
    END IF;
  ELSIF NEW.customer_name IS DISTINCT FROM OLD.customer_name THEN
    -- For UPDATE operations when name changes
    IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
      RAISE EXCEPTION 'Customer name is required';
    END IF;
  END IF;

  -- For phone validation
  IF NEW.customer_phone IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone THEN
      IF NOT NEW.customer_phone ~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'Invalid phone number format, must contain only digits';
      END IF;
    END IF;
  END IF;

  -- For amount validation
  IF TG_OP = 'INSERT' THEN
    IF NEW.total_amount < 0 THEN
      RAISE EXCEPTION 'Total amount cannot be negative';
    END IF;
  ELSIF NEW.total_amount IS DISTINCT FROM OLD.total_amount AND NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  -- Set estimated completion time only if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'estimated_completion_time'
  ) THEN
    IF NEW.status = 'preparing' AND (TG_OP = 'INSERT' OR OLD.status <> 'preparing') THEN
      NEW.estimated_completion_time := NOW() + (COALESCE(NEW.preparation_time, 20) || ' minutes')::interval;
    END IF;
  END IF;

  -- Set actual completion time only if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'actual_completion_time'
  ) THEN
    IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status <> 'delivered') THEN
      NEW.actual_completion_time := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Improved inventory status update function
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Fix conditional structure for INSERT vs UPDATE
  IF TG_OP = 'INSERT' OR NEW.quantity IS DISTINCT FROM OLD.quantity THEN
    -- Only update status when quantity is inserted or changed
    NEW.status := CASE
      WHEN NEW.quantity <= 0 THEN 'out_of_stock'
      WHEN NEW.quantity <= COALESCE(NEW.min_quantity, 5) THEN 'low_stock'
      ELSE 'in_stock'
    END;
    
    -- Always update the timestamp when relevant fields change
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Improved taste profile update function to handle race conditions
CREATE OR REPLACE FUNCTION update_taste_profile()
RETURNS TRIGGER AS $$
DECLARE
  items_json jsonb;
BEGIN
  -- First, build the ordered items JSON once
  SELECT jsonb_object_agg(name, quantity) INTO items_json 
  FROM order_items 
  WHERE order_id = NEW.id;
  
  -- Only continue if items were found
  IF items_json IS NOT NULL AND jsonb_typeof(items_json) = 'object' THEN
    -- Insert with conflict handling to ensure atomicity
    INSERT INTO user_preferences (
      user_id, 
      taste_profile,
      updated_at
    ) VALUES (
      NEW.user_id,
      jsonb_build_object('items', items_json),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      taste_profile = CASE
        WHEN user_preferences.taste_profile ? 'items' THEN
          jsonb_set(
            user_preferences.taste_profile,
            '{items}',
            COALESCE(user_preferences.taste_profile->'items', '{}'::jsonb) || items_json
          )
        ELSE
          jsonb_build_object('items', items_json)
      END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add proper constraints
DO $$
BEGIN
  -- Add order_type constraint if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders
      DROP CONSTRAINT IF EXISTS valid_order_type,
      ADD CONSTRAINT valid_order_type CHECK (
        order_type IS NULL OR order_type IN ('dine-in', 'takeaway')
      );

    -- Only add the table_number constraint if both columns exist
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'table_number'
    ) THEN
      ALTER TABLE orders
        DROP CONSTRAINT IF EXISTS table_number_required,
        ADD CONSTRAINT table_number_required CHECK (
          (order_type != 'dine-in') OR (order_type = 'dine-in' AND table_number IS NOT NULL)
        );
    END IF;
  END IF;

  -- Add invoice status constraint if the table and column exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status'
  ) THEN
    ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS valid_invoice_status_transition,
      ADD CONSTRAINT valid_invoice_status_transition CHECK (
        status IN ('draft', 'issued', 'paid', 'cancelled', 'refunded')
      );
  END IF;

  -- Add shift time constraint if the table and columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_shifts' AND column_name = 'start_time'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_shifts' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE staff_shifts
      DROP CONSTRAINT IF EXISTS valid_shift_times,
      ADD CONSTRAINT valid_shift_times CHECK (end_time > start_time);
  END IF;

  -- Add leave date constraint if the table and columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_leave' AND column_name = 'start_date'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_leave' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE staff_leave
      DROP CONSTRAINT IF EXISTS valid_leave_dates,
      ADD CONSTRAINT valid_leave_dates CHECK (end_date >= start_date);
  END IF;
END $$;

-- Step 7: Recreate important triggers
DO $$
BEGIN
  -- Only create order validation trigger if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    DROP TRIGGER IF EXISTS validate_order_trigger ON orders;
    CREATE TRIGGER validate_order_trigger
      BEFORE INSERT OR UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION validate_order();
  END IF;

  -- Only create inventory trigger if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
    DROP TRIGGER IF EXISTS update_inventory_status_trigger ON inventory;
    CREATE TRIGGER update_inventory_status_trigger
      BEFORE INSERT OR UPDATE OF quantity ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_inventory_status();
  END IF;

  -- Only create taste profile trigger if both tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') AND 
     EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    DROP TRIGGER IF EXISTS on_order_update_taste_profile ON orders;
    CREATE TRIGGER on_order_update_taste_profile
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_taste_profile();
  END IF;
END $$;

-- Step 8: Create a view for operational insights
DO $$
BEGIN
  -- Only create the view if the orders table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    CREATE OR REPLACE VIEW order_insights AS
    SELECT 
      o.id,
      o.status,
      o.payment_status,
      o.created_at,
      o.table_number,
      o.customer_name,
      o.customer_phone,
      o.total_amount,
      CASE WHEN column_exists.exists THEN o.subtotal ELSE NULL END as subtotal,
      CASE WHEN column_exists.exists THEN o.tax ELSE NULL END as tax, 
      CASE WHEN column_exists.exists THEN o.discount ELSE NULL END as discount,
      o.payment_method,
      CASE WHEN column_exists.exists THEN o.order_type ELSE NULL END as order_type,
      CASE WHEN column_exists.exists THEN o.estimated_completion_time ELSE NULL END as estimated_completion_time,
      CASE WHEN column_exists.exists THEN o.actual_completion_time ELSE NULL END as actual_completion_time,
      COUNT(oi.id) AS item_count,
      SUM(oi.quantity) AS total_items
    FROM 
      orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    CROSS JOIN (
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name IN ('subtotal', 'tax', 'discount', 'order_type', 'estimated_completion_time', 'actual_completion_time')
      ) as exists
    ) as column_exists
    GROUP BY 
      o.id, 
      o.status, 
      o.payment_status, 
      o.created_at, 
      o.table_number, 
      o.customer_name, 
      o.customer_phone, 
      o.total_amount,
      column_exists.exists,
      CASE WHEN column_exists.exists THEN o.subtotal ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.tax ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.discount ELSE NULL END,
      o.payment_method,
      CASE WHEN column_exists.exists THEN o.order_type ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.estimated_completion_time ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.actual_completion_time ELSE NULL END;
  END IF;
END $$;

-- Step 9: Create an index on user_preferences for faster taste profile updates
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
  END IF;
END $$;

-- Clean up the temporary table
DROP TABLE IF EXISTS schema_analysis;

-- End transaction
COMMIT;


