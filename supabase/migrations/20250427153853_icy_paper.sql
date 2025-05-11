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