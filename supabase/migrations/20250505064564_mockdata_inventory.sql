/*
  # Add mock inventory data

  1. Changes
    - Insert sample inventory items
    - Add realistic stock levels and pricing
    - Include various categories and units
*/

-- Insert mock inventory data
INSERT INTO inventory (
  name,
  category,
  quantity,
  unit,
  min_quantity,
  max_quantity,
  cost_price,
  supplier,
  storage_location,
  status,
  notes
) VALUES
  -- Dry Goods
  ('Rice', 'dry_goods', 50.0, 'kg', 20.0, 100.0, 85.0, 'Global Foods Ltd', 'Dry Storage A1', 'in_stock', 'Basmati rice'),
  ('All Purpose Flour', 'dry_goods', 30.0, 'kg', 15.0, 60.0, 45.0, 'Baker''s Supply Co', 'Dry Storage A2', 'in_stock', 'Premium quality'),
  ('Sugar', 'dry_goods', 25.0, 'kg', 10.0, 50.0, 40.0, 'Sweet Supplies Inc', 'Dry Storage A3', 'in_stock', 'Granulated white sugar'),
  
  -- Spices
  ('Black Pepper', 'spices', 5.0, 'kg', 2.0, 10.0, 600.0, 'Spice Traders Ltd', 'Spice Rack B1', 'in_stock', 'Whole black peppercorns'),
  ('Ground Cumin', 'spices', 3.0, 'kg', 1.0, 5.0, 450.0, 'Spice Traders Ltd', 'Spice Rack B2', 'in_stock', 'Premium ground cumin'),
  ('Turmeric Powder', 'spices', 4.0, 'kg', 1.5, 6.0, 380.0, 'Spice Traders Ltd', 'Spice Rack B3', 'low_stock', 'Pure turmeric powder'),
  
  -- Dairy
  ('Butter', 'dairy', 20.0, 'kg', 10.0, 30.0, 400.0, 'Fresh Dairy Co', 'Cold Storage C1', 'in_stock', 'Unsalted butter'),
  ('Cheese', 'dairy', 15.0, 'kg', 8.0, 25.0, 450.0, 'Fresh Dairy Co', 'Cold Storage C2', 'low_stock', 'Mozzarella cheese'),
  ('Heavy Cream', 'dairy', 10.0, 'L', 5.0, 20.0, 200.0, 'Fresh Dairy Co', 'Cold Storage C3', 'in_stock', 'Fresh heavy cream'),
  
  -- Vegetables
  ('Onions', 'vegetables', 40.0, 'kg', 20.0, 60.0, 35.0, 'Fresh Produce Inc', 'Vegetable Storage D1', 'in_stock', 'Red onions'),
  ('Tomatoes', 'vegetables', 25.0, 'kg', 15.0, 45.0, 45.0, 'Fresh Produce Inc', 'Vegetable Storage D2', 'in_stock', 'Roma tomatoes'),
  ('Bell Peppers', 'vegetables', 10.0, 'kg', 8.0, 20.0, 80.0, 'Fresh Produce Inc', 'Vegetable Storage D3', 'low_stock', 'Mixed colors'),
  
  -- Meat
  ('Chicken Breast', 'meat', 30.0, 'kg', 15.0, 40.0, 220.0, 'Premium Meats Ltd', 'Freezer E1', 'in_stock', 'Boneless, skinless'),
  ('Ground Beef', 'meat', 25.0, 'kg', 12.0, 35.0, 280.0, 'Premium Meats Ltd', 'Freezer E2', 'in_stock', '80/20 lean'),
  ('Fish Fillet', 'meat', 15.0, 'kg', 10.0, 25.0, 350.0, 'Seafood Express', 'Freezer E3', 'low_stock', 'Fresh cod fillet'),
  
  -- Packaging
  ('Takeout Containers', 'packaging', 500.0, 'pieces', 200.0, 1000.0, 8.0, 'Package Plus', 'Storage F1', 'in_stock', '500ml size'),
  ('Paper Bags', 'packaging', 300.0, 'pieces', 150.0, 600.0, 5.0, 'Package Plus', 'Storage F2', 'in_stock', 'Medium size'),
  ('Plastic Cutlery Sets', 'packaging', 200.0, 'sets', 100.0, 400.0, 3.0, 'Package Plus', 'Storage F3', 'low_stock', 'Fork, knife, spoon'),
  
  -- Beverages
  ('Cola Syrup', 'beverages', 20.0, 'L', 10.0, 30.0, 150.0, 'Beverage Supply Co', 'Beverage Storage G1', 'in_stock', 'Fountain drink syrup'),
  ('Coffee Beans', 'beverages', 15.0, 'kg', 8.0, 25.0, 450.0, 'Coffee Traders Inc', 'Beverage Storage G2', 'in_stock', 'Arabica blend'),
  ('Tea Bags', 'beverages', 1000.0, 'pieces', 500.0, 2000.0, 0.5, 'Tea Traders Ltd', 'Beverage Storage G3', 'in_stock', 'English Breakfast'),
  
  -- Cleaning Supplies
  ('Dish Soap', 'cleaning', 30.0, 'L', 15.0, 50.0, 45.0, 'Clean Supply Co', 'Cleaning Storage H1', 'in_stock', 'Commercial grade'),
  ('Sanitizer', 'cleaning', 25.0, 'L', 12.0, 40.0, 55.0, 'Clean Supply Co', 'Cleaning Storage H2', 'in_stock', 'Food-safe sanitizer'),
  ('Paper Towels', 'cleaning', 100.0, 'rolls', 50.0, 200.0, 15.0, 'Clean Supply Co', 'Cleaning Storage H3', 'low_stock', 'Industrial rolls');

-- Record initial transactions
INSERT INTO inventory_transactions (
  inventory_id,
  transaction_type,
  quantity,
  previous_quantity,
  new_quantity,
  unit_cost,
  total_cost,
  reference_number,
  notes
)
SELECT 
  id,
  'initial_stock',
  quantity,
  0,
  quantity,
  cost_price,
  quantity * cost_price,
  'INIT-' || gen_random_uuid()::text,
  'Initial inventory setup'
FROM inventory;
