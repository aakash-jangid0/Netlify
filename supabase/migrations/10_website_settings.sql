/*
  # 10_website_settings.sql - Complete Website Settings Management
  
  This migration creates a comprehensive website settings system including:
  - Website customization options (header, footer, colors)
  - Hero section configuration
  - Featured sections and popular dishes
  - Contact information and social media links
  - SEO and meta tag settings
  
  Consolidated from: 12_website_settings.sql, 13_website_settings_alt.sql, 17_website_settings_from_database.sql
  Generated: 2025-05-31
*/

-- Create website_settings table with comprehensive features
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Header settings
  logo_url TEXT,
  site_name TEXT NOT NULL DEFAULT 'TastyBites',
  tagline TEXT,
  header_bg_color TEXT DEFAULT '#ffffff',
  
  -- Footer settings
  footer_text TEXT NOT NULL DEFAULT '© 2025 TastyBites. All rights reserved.',
  footer_bg_color TEXT DEFAULT '#f3f4f6',
  footer_text_color TEXT DEFAULT '#6b7280',
  show_social_links BOOLEAN DEFAULT true,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  
  -- Contact information
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  opening_hours TEXT,
  
  -- Hero section
  hero_image_url TEXT,
  hero_title TEXT,
  hero_description TEXT,
  hero_button_text TEXT,
  hero_button_url TEXT,
  
  -- Features section
  show_featured_section BOOLEAN DEFAULT true,
  featured_title TEXT DEFAULT 'Why Choose Us',
  features_title TEXT DEFAULT 'Why Choose Us',
  feature_1_title TEXT DEFAULT 'Fresh Ingredients',
  feature_1_description TEXT DEFAULT 'We use only the finest, locally-sourced ingredients',
  feature_2_title TEXT DEFAULT 'Quick Service',
  feature_2_description TEXT DEFAULT 'Efficient table service within 15 minutes of ordering',
  feature_3_title TEXT DEFAULT 'Best Quality',
  feature_3_description TEXT DEFAULT 'Award-winning dishes prepared by expert chefs',
  
  -- About section
  show_about_section BOOLEAN DEFAULT true,
  about_title TEXT,
  about_description TEXT,
  about_image_url TEXT,
  
  -- Contact section
  show_contact_section BOOLEAN DEFAULT true,
  contact_title TEXT,
  contact_description TEXT,
  
  -- Popular dishes section
  popular_dishes_title TEXT DEFAULT 'Popular Dishes',
  popular_dish_1_name TEXT DEFAULT 'Signature Burger',
  popular_dish_1_image TEXT,
  popular_dish_1_price TEXT DEFAULT 'Rs299',
  popular_dish_1_description TEXT DEFAULT 'Juicy beef patty with fresh lettuce, tomatoes, and our special sauce',
  popular_dish_2_name TEXT DEFAULT 'Chicken Tikka',
  popular_dish_2_image TEXT,
  popular_dish_2_price TEXT DEFAULT 'Rs249',
  popular_dish_2_description TEXT DEFAULT 'Tender chicken marinated in aromatic spices and grilled to perfection',
  popular_dish_3_name TEXT DEFAULT 'Margherita Pizza',
  popular_dish_3_image TEXT,
  popular_dish_3_price TEXT DEFAULT 'Rs199',
  popular_dish_3_description TEXT DEFAULT 'Classic Italian pizza with fresh mozzarella and basil',
  
  -- Theme and styling
  primary_color TEXT DEFAULT '#f97316',
  secondary_color TEXT DEFAULT '#ffa500',
  accent_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  
  -- SEO settings
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image_url TEXT,
  
  -- Business hours
  monday_hours TEXT DEFAULT '9:00 AM - 10:00 PM',
  tuesday_hours TEXT DEFAULT '9:00 AM - 10:00 PM',
  wednesday_hours TEXT DEFAULT '9:00 AM - 10:00 PM',
  thursday_hours TEXT DEFAULT '9:00 AM - 10:00 PM',
  friday_hours TEXT DEFAULT '9:00 AM - 11:00 PM',
  saturday_hours TEXT DEFAULT '9:00 AM - 11:00 PM',
  sunday_hours TEXT DEFAULT '10:00 AM - 9:00 PM',
  
  -- Additional settings
  enable_online_ordering BOOLEAN DEFAULT true,
  enable_table_reservations BOOLEAN DEFAULT true,
  delivery_radius INTEGER DEFAULT 10, -- in kilometers
  minimum_order_amount DECIMAL(10,2) DEFAULT 100.00,
  delivery_fee DECIMAL(10,2) DEFAULT 30.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_website_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER website_settings_updated_at
  BEFORE UPDATE ON website_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_website_settings_timestamp();

-- Insert default website settings
INSERT INTO website_settings (
  site_name,
  tagline,
  hero_title,
  hero_description,
  hero_button_text,
  hero_button_url,
  contact_email,
  contact_phone,
  contact_address,
  about_title,
  about_description
) VALUES (
  'TastyBites',
  'Delicious Food, Fresh Ingredients',
  'Welcome to TastyBites',
  'Experience the finest dining with our carefully crafted dishes made from fresh, locally-sourced ingredients.',
  'Order Now',
  '/menu',
  'info@tastybites.com',
  '+91 98765 43210',
  'Malad West, Mumbai, Maharashtra 400064',
  'About TastyBites',
  'We are passionate about creating exceptional dining experiences. Our team of expert chefs combines traditional recipes with modern culinary techniques to bring you unforgettable flavors.'
) ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_settings_business_id ON website_settings(business_id);

-- Add comments for documentation
COMMENT ON TABLE website_settings IS 'Comprehensive website customization and configuration settings';
COMMENT ON COLUMN website_settings.business_id IS 'Optional reference to specific business (for multi-tenant setups)';
COMMENT ON COLUMN website_settings.delivery_radius IS 'Delivery service radius in kilometers';
COMMENT ON COLUMN website_settings.minimum_order_amount IS 'Minimum order amount for delivery service';
