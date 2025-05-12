/*
  # 02_core_tables.sql - Core Tables Migration
  
  Creates the core tables that form the foundation of the restaurant management system.
  
  This migration handles:
  - Profiles table (linked to auth.users)
  - Orders table (main order tracking)
  - Order_items table (items within an order)
  - RLS policies for these tables
  
  Generated: 2025-05-12
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer',
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Additional columns identified in DB analysis
  referral_source TEXT,
  lifetime_value NUMERIC DEFAULT 0,
  churn_risk NUMERIC DEFAULT 0,
  last_engagement_date TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  dietary_restrictions_verified BOOLEAN DEFAULT false
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_order_id TEXT DEFAULT generate_order_id(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status ORDER_STATUS DEFAULT 'pending',
  order_type ORDER_TYPE DEFAULT 'dine_in',
  table_number INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  payment_method PAYMENT_METHOD,
  payment_status PAYMENT_STATUS DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Additional columns identified in DB analysis
  personalization_applied BOOLEAN DEFAULT false,
  recommendation_source TEXT,
  personalization_effectiveness NUMERIC,
  estimated_completion_time TIMESTAMPTZ,
  actual_completion_time TIMESTAMPTZ,
  preparation_time INTEGER,
  has_feedback BOOLEAN DEFAULT false
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Additional columns identified in DB analysis
  preparation_status TEXT DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create update triggers for timestamp maintenance
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Create RLS policies for order_items
CREATE POLICY "Users can view items from their orders"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR auth.role() = 'service_role')
  )
);

CREATE POLICY "Users can create items for their orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
