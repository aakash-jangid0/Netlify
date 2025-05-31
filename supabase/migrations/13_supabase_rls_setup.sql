-- First, enable RLS on the customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to select customers
CREATE POLICY "Allow authenticated users to view customers"
ON customers
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update customers
CREATE POLICY "Allow authenticated users to update customers"
ON customers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete customers
CREATE POLICY "Allow authenticated users to delete customers"
ON customers
FOR DELETE
TO authenticated
USING (true);
