-- Create staff_documents table
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  file_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add a commit point to ensure the table is fully created
COMMIT;

-- Create indexes for staff_documents
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON public.staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_category ON public.staff_documents("category");
CREATE INDEX IF NOT EXISTS idx_staff_documents_status ON public.staff_documents(status);

-- Create staff_performance_reviews table
CREATE TABLE IF NOT EXISTS public.staff_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rating TEXT NOT NULL CHECK (rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory')),
  goals_achieved TEXT[] DEFAULT '{}',
  areas_of_improvement TEXT[] DEFAULT '{}',
  comments TEXT,
  next_review_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for staff_performance_reviews
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_staff_id ON public.staff_performance_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_reviewer_id ON public.staff_performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_rating ON public.staff_performance_reviews(rating);

-- Enable RLS on staff_documents
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on staff_performance_reviews
ALTER TABLE public.staff_performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_documents
DO $$
BEGIN
  -- Admin can manage all documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_documents' AND policyname = 'Admin can manage all documents') THEN
    CREATE POLICY "Admin can manage all documents" 
    ON public.staff_documents FOR ALL 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.staff
        WHERE 
          user_id = auth.uid() AND 
          (role = 'admin' OR role = 'manager')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.staff
        WHERE 
          user_id = auth.uid() AND 
          (role = 'admin' OR role = 'manager')
      )
    );
  END IF;

  -- Staff can view their own documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_documents' AND policyname = 'Staff can view their own documents') THEN
    CREATE POLICY "Staff can view their own documents" 
    ON public.staff_documents FOR SELECT 
    TO authenticated
    USING (
      staff_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Create policies for staff_performance_reviews
DO $$
BEGIN
  -- Admin can manage all reviews
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_performance_reviews' AND policyname = 'Admin can manage all reviews') THEN
    CREATE POLICY "Admin can manage all reviews" 
    ON public.staff_performance_reviews FOR ALL 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.staff
        WHERE 
          user_id = auth.uid() AND 
          (role = 'admin' OR role = 'manager')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.staff
        WHERE 
          user_id = auth.uid() AND 
          (role = 'admin' OR role = 'manager')
      )
    );
  END IF;

  -- Staff can view their own reviews
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_performance_reviews' AND policyname = 'Staff can view their own reviews') THEN
    CREATE POLICY "Staff can view their own reviews" 
    ON public.staff_performance_reviews FOR SELECT 
    TO authenticated
    USING (
      staff_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
      )
    );
  END IF;

  -- Staff can update their goals for reviews involving them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_performance_reviews' AND policyname = 'Staff can update their own goals') THEN
    CREATE POLICY "Staff can update their own goals" 
    ON public.staff_performance_reviews FOR UPDATE
    TO authenticated
    USING (
      staff_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
      )
    )
    WITH CHECK (
      staff_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
      )
    );
  END IF;
END
$$;
