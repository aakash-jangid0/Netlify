-- Create performance_rating type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'performance_rating') THEN
    CREATE TYPE performance_rating AS ENUM (
      'excellent',
      'good',
      'satisfactory',
      'needs_improvement',
      'unsatisfactory'
    );
  END IF;
END$$;

-- Create staff_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_staff_documents_staff
    FOREIGN KEY (staff_id)
    REFERENCES public.staff(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON public.staff_documents(staff_id);

-- Create staff_performance_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rating TEXT NOT NULL,
  goals_achieved TEXT[] DEFAULT '{}',
  areas_of_improvement TEXT[] DEFAULT '{}',
  comments TEXT,
  next_review_date TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_staff_performance_reviews_staff
    FOREIGN KEY (staff_id)
    REFERENCES public.staff(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_staff_id ON public.staff_performance_reviews(staff_id);

-- Enable RLS on both tables
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_documents
CREATE POLICY IF NOT EXISTS "Admin can manage all documents" 
  ON public.staff_documents FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE 
        user_id = auth.uid() AND 
        (role = 'admin' OR role = 'manager')
    )
  );

CREATE POLICY IF NOT EXISTS "Staff can view their own documents" 
  ON public.staff_documents FOR SELECT 
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- Create policies for staff_performance_reviews
CREATE POLICY IF NOT EXISTS "Admin can manage all reviews" 
  ON public.staff_performance_reviews FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE 
        user_id = auth.uid() AND 
        (role = 'admin' OR role = 'manager')
    )
  );

CREATE POLICY IF NOT EXISTS "Staff can view their own reviews" 
  ON public.staff_performance_reviews FOR SELECT 
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- Insert sample data for testing if tables are empty
INSERT INTO public.staff_documents (staff_id, document_type, document_name, document_url)
SELECT 
  s.id,
  'Contract',
  'Employment Contract',
  'https://example.com/contracts/sample.pdf'
FROM 
  public.staff s
WHERE 
  NOT EXISTS (SELECT 1 FROM public.staff_documents WHERE staff_id = s.id)
LIMIT 5;

-- Insert sample performance reviews if table is empty
INSERT INTO public.staff_performance_reviews (staff_id, rating, goals_achieved, areas_of_improvement, comments, reviewer_id)
SELECT 
  s.id,
  'good',
  ARRAY['Met quarterly targets', 'Completed training'],
  ARRAY['Communication skills', 'Time management'],
  'Good performance overall. Continue professional development.',
  (SELECT id FROM public.staff WHERE role = 'admin' OR role = 'manager' LIMIT 1)
FROM 
  public.staff s
WHERE 
  NOT EXISTS (SELECT 1 FROM public.staff_performance_reviews WHERE staff_id = s.id)
LIMIT 5;
