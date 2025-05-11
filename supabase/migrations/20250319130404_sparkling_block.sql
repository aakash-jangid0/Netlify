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