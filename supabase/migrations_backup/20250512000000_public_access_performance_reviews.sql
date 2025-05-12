-- Allow public access to staff performance reviews table for all operations

-- Drop existing restrictive policies that require authentication
DROP POLICY IF EXISTS "Admin can manage all reviews" ON public.staff_performance_reviews;
DROP POLICY IF EXISTS "Staff can view their own reviews" ON public.staff_performance_reviews;
DROP POLICY IF EXISTS "Staff can update their own goals" ON public.staff_performance_reviews;

-- Create new permissive policies for public access
CREATE POLICY "Public can view performance reviews" 
ON public.staff_performance_reviews FOR SELECT 
TO public
USING (true);

CREATE POLICY "Public can insert performance reviews" 
ON public.staff_performance_reviews FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can update performance reviews" 
ON public.staff_performance_reviews FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete performance reviews" 
ON public.staff_performance_reviews FOR DELETE 
TO public
USING (true);

-- Grant permissions to anonymous and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_performance_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_performance_reviews TO authenticated;
GRANT USAGE ON SEQUENCE public.staff_performance_reviews_id_seq TO anon, authenticated;
