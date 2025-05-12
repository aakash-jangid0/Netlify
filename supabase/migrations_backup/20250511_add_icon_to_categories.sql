-- Add icon column to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Update existing categories with default icons
UPDATE categories SET icon = 'Pizza' WHERE slug = 'main';
UPDATE categories SET icon = 'Soup' WHERE slug = 'appetizer';
UPDATE categories SET icon = 'IceCream' WHERE slug = 'dessert';
UPDATE categories SET icon = 'Coffee' WHERE slug = 'beverage';
UPDATE categories SET icon = 'SandwichIcon' WHERE slug = 'sides';
UPDATE categories SET icon = 'Star' WHERE slug = 'specials';
