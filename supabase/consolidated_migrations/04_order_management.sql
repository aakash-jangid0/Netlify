-- Order Management Tables
-- Orders, Order Items, Order Feedback
-- Date: 2025-08-24

CREATE TABLE IF NOT EXISTS orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status order_status DEFAULT 'pending'::order_status,
  total_amount numeric NOT NULL,
  customer_name text,
  customer_id uuid REFERENCES customers(id),
  table_number text,
  order_type text,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_phone text,
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  personalization_applied boolean DEFAULT false,
  recommendation_source text,
  personalization_effectiveness numeric,
  estimated_completion_time timestamp with time zone,
  actual_completion_time timestamp with time zone,
  preparation_time integer,
  payment_status varchar(20) DEFAULT 'pending'::character varying,
  user_id uuid,
  has_feedback boolean DEFAULT false,
  customer_email text,
  coupon_id integer,
  coupon_discount_amount numeric(10,2) DEFAULT 0,
  coupon_code text,
  coupon_discount_type text DEFAULT 'percentage'::text,
  coupon_discount_value numeric DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS order_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  user_id uuid,
  overall_rating integer NOT NULL,
  food_quality_rating integer NOT NULL,
  service_rating integer NOT NULL,
  delivery_time_rating integer,
  value_for_money_rating integer,
  comments text,
  customer_name text,
  customer_email text,
  customer_phone text,
  items_feedback jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Order management indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Add comments for documentation
COMMENT ON COLUMN orders.customer_id IS 'Links to customers.id for analytics and customer tracking';
