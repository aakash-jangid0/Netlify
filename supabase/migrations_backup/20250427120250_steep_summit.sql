/*
  # Add subtotal and related columns to orders

  1. Changes
    - Add subtotal column to orders table
    - Add tax column to orders table
    - Add discount column to orders table
    - Add validation checks for numeric fields
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0 CHECK (tax >= 0),
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0 CHECK (discount >= 0);