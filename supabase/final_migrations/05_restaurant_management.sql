/*
  # 05_restaurant_management.sql - Restaurant Management Migration
  
  Creates tables and functions related to restaurant operations.
  
  This migration handles:
  - Tables (restaurant tables)
  - Menu items
  - Categories
  - RLS policies for restaurant operations
  
  Generated: 2025-05-12
*/

-- Create tables (restaurant tables) table
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 4,
  location TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_occupied_at TIMESTAMPTZ,
  is_reserved BOOLEAN DEFAULT false,
  reservation_id UUID,
  qr_code_url TEXT,
  notes TEXT
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  category_id UUID,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  preparation_time INTEGER,
  ingredients TEXT[],
  allergens TEXT[],
  nutritional_info JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  spice_level INTEGER CHECK (spice_level BETWEEN 0 AND 5),
  popularity_score NUMERIC DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  seasonal_availability TEXT[]
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint after both tables exist
ALTER TABLE public.menu_items 
ADD CONSTRAINT fk_menu_items_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create update triggers for timestamp maintenance
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create function to update table status
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'occupied' THEN
    NEW.last_occupied_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_status_on_change
BEFORE UPDATE ON public.tables
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_table_status();

-- Create function to calculate menu item popularity
CREATE OR REPLACE FUNCTION update_menu_item_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.menu_items
  SET popularity_score = (
    SELECT COUNT(*)
    FROM public.order_items
    WHERE name = menu_items.name
    AND created_at > now() - interval '30 days'
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_item_popularity_on_change
AFTER INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_menu_item_popularity();

-- Enable Row Level Security
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tables
CREATE POLICY "Authenticated users can view tables"
ON public.tables
FOR SELECT
TO authenticated
USING (true);

-- Create RLS policies for menu_items
CREATE POLICY "Anyone can view available menu items"
ON public.menu_items
FOR SELECT
USING (is_available = true);

CREATE POLICY "Staff can view all menu items"
ON public.menu_items
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role' OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('admin', 'staff')
));

-- Create RLS policies for categories
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role' OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('admin', 'staff')
));

-- Grant permissions
GRANT ALL ON public.tables TO authenticated;
GRANT ALL ON public.menu_items TO authenticated;
GRANT ALL ON public.categories TO authenticated;
