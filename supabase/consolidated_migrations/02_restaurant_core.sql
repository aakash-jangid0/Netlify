-- Restaurant Core Tables
-- Categories, Menu Items, Tables, Website Settings
-- Date: 2025-08-24

CREATE TABLE IF NOT EXISTS categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  image text NOT NULL,
  category text NOT NULL,
  preparation_time integer NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_number text NOT NULL,
  capacity integer NOT NULL,
  status text DEFAULT 'available'::text,
  current_order_id uuid,
  occupied_since timestamp with time zone,
  last_cleaned_at timestamp with time zone,
  section text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS website_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  logo_url text,
  site_name text NOT NULL DEFAULT 'TastyBites'::text,
  tagline text,
  header_bg_color text DEFAULT '#ffffff'::text,
  footer_text text NOT NULL DEFAULT '© 2025 TastyBites. All rights reserved.'::text,
  footer_bg_color text DEFAULT '#f3f4f6'::text,
  footer_text_color text DEFAULT '#6b7280'::text,
  show_social_links boolean DEFAULT true,
  facebook_url text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  contact_email text,
  contact_phone text,
  contact_address text,
  opening_hours text,
  hero_image_url text,
  hero_title text,
  hero_description text,
  hero_button_text text,
  hero_button_url text,
  features_title text DEFAULT 'Why Choose Us'::text,
  feature_1_title text DEFAULT 'Fresh Ingredients'::text,
  feature_1_description text DEFAULT 'We use only the finest, locally-sourced ingredients'::text,
  feature_2_title text DEFAULT 'Quick Service'::text,
  feature_2_description text DEFAULT 'Efficient table service within 15 minutes of ordering'::text,
  feature_3_title text DEFAULT 'Best Quality'::text,
  feature_3_description text DEFAULT 'Award-winning dishes prepared by expert chefs'::text,
  popular_dishes_title text DEFAULT 'Popular Dishes'::text,
  popular_dish_1_name text DEFAULT 'Signature Burger'::text,
  popular_dish_1_image text,
  popular_dish_1_price text DEFAULT 'Rs299'::text,
  popular_dish_1_description text DEFAULT 'Juicy beef patty with fresh lettuce, tomatoes, and our special sauce'::text,
  popular_dish_2_name text DEFAULT 'Margherita Pizza'::text,
  popular_dish_2_image text,
  popular_dish_2_price text DEFAULT 'Rs349'::text,
  popular_dish_2_description text DEFAULT 'Fresh mozzarella, tomatoes, and basil on our homemade crust'::text,
  popular_dish_3_name text DEFAULT 'Fresh Pasta'::text,
  popular_dish_3_image text,
  popular_dish_3_price text DEFAULT 'Rs399'::text,
  popular_dish_3_description text DEFAULT 'Handmade pasta with your choice of sauce'::text,
  cta_title text DEFAULT 'Ready to Experience Our Cuisine?'::text,
  cta_description text DEFAULT 'Join us for an unforgettable dining experience'::text,
  cta_button_text text DEFAULT 'View Full Menu'::text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  primary_color text DEFAULT '#f97316'::text,
  secondary_color text DEFAULT '#1f2937'::text,
  accent_color text DEFAULT '#fbbf24'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  popular_dish_ids text[] DEFAULT '{}'::text[],
  hours_mon_fri text DEFAULT 'Mon - Fri: 11:00 AM - 10:00 PM'::text,
  hours_sat text DEFAULT 'Sat: 11:00 AM - 11:00 PM'::text,
  hours_sun text DEFAULT 'Sun: 12:00 PM - 9:00 PM'::text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS health_check (
  id integer NOT NULL DEFAULT nextval('health_check_id_seq'::regclass),
  status text NOT NULL DEFAULT 'ok'::text,
  last_checked timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Create restaurant core indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
