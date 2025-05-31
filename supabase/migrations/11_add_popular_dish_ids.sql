-- Add popular_dish_ids field for linking to actual menu items
-- This allows for dynamic selection from the menu instead of static dish data

ALTER TABLE website_settings 
ADD COLUMN IF NOT EXISTS popular_dish_ids TEXT[] DEFAULT '{}';

-- Add simplified opening hours fields that match our interface
ALTER TABLE website_settings 
ADD COLUMN IF NOT EXISTS hours_mon_fri TEXT DEFAULT 'Mon - Fri: 11:00 AM - 10:00 PM';

ALTER TABLE website_settings 
ADD COLUMN IF NOT EXISTS hours_sat TEXT DEFAULT 'Sat: 11:00 AM - 11:00 PM';

ALTER TABLE website_settings 
ADD COLUMN IF NOT EXISTS hours_sun TEXT DEFAULT 'Sun: 12:00 PM - 9:00 PM';

-- Update the updated_at timestamp for existing records
UPDATE website_settings 
SET updated_at = NOW() 
WHERE updated_at IS NOT NULL;
