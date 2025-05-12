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