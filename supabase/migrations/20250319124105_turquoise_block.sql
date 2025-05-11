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