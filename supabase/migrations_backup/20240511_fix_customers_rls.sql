/*
  # Fix Customers Table RLS Policies

  This migration addresses the row-level security policy issues
  for the customers table that were causing permission errors.

  1. Enable RLS if not already enabled
  2. Drop any conflicting policies
  3. Create comprehensive policies for authenticated users
*/

BEGIN;

-- Make sure RLS is enabled on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view customers" ON customers;
DROP POLICY IF EXISTS "Staff can insert customers" ON customers;
DROP POLICY IF EXISTS "Staff can update customers" ON customers;
DROP POLICY IF EXISTS "Staff can delete customers" ON customers;
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- Create new comprehensive policies for authenticated users
CREATE POLICY "Authenticated users can view customers"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
ON customers FOR DELETE
TO authenticated
USING (true);

-- Ensure public access is also enabled for the customers table
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO service_role;

COMMIT;
