/*
  # 04_staff_management.sql - Staff Management Migration
  
  Creates tables and functions related to staff management.
  
  This migration handles:
  - Staff table
  - Staff documents
  - Staff attendance and shifts
  - Staff performance reviews
  - RLS policies for staff data
  
  Generated: 2025-05-12
*/

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL,
  department TEXT,
  start_date DATE NOT NULL,
  profile_photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Extended information
  hire_status TEXT DEFAULT 'active',
  contract_type TEXT DEFAULT 'full-time',
  probation_end_date DATE,
  notice_period TEXT DEFAULT '30 days',
  skills TEXT[],
  certifications TEXT[],
  performance_score NUMERIC,
  leave_balance JSONB DEFAULT '{}'::JSONB,
  
  -- Personal information
  date_of_birth DATE,
  national_id TEXT,
  gender TEXT,
  marital_status TEXT,
  blood_group TEXT,
  nationality TEXT,
  
  -- Employment details
  joining_date DATE,
  employment_history JSONB,
  
  -- Salary information
  base_salary NUMERIC,
  hourly_rate NUMERIC,
  payment_schedule TEXT DEFAULT 'monthly',
  bank_name TEXT,
  bank_account TEXT,
  tax_id TEXT,
  bonus NUMERIC,
  deductions NUMERIC,
  net_salary NUMERIC,
  
  -- Scheduling
  working_hours_per_week INTEGER DEFAULT 40,
  default_shift TEXT,
  weekend_availability BOOLEAN DEFAULT false,
  overtime_eligible BOOLEAN DEFAULT true,
  time_off_accrual_rate NUMERIC DEFAULT 1.5,
  annual_leave_balance INTEGER DEFAULT 0,
  sick_leave_balance INTEGER DEFAULT 0,
  leave_start_date DATE,
  leave_end_date DATE,
  leave_reason TEXT,
  
  -- Performance
  last_evaluation_date DATE,
  evaluation_score NUMERIC,
  next_evaluation_date DATE,
  performance_notes TEXT,
  
  -- Add constraints
  CONSTRAINT staff_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  CONSTRAINT staff_employee_id_unique UNIQUE (employee_id)
);

-- Create staff_documents table
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff_attendance table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  total_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff_shifts table
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_type TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  break_duration TEXT DEFAULT '30',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff_performance_reviews table
CREATE TABLE IF NOT EXISTS public.staff_performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  reviewer_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  goals TEXT[],
  strengths TEXT[],
  areas_for_improvement TEXT[],
  training_recommendations TEXT[],
  follow_up_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create update triggers for timestamp maintenance
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_staff_documents_updated_at
BEFORE UPDATE ON public.staff_documents
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_staff_attendance_updated_at
BEFORE UPDATE ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_staff_shifts_updated_at
BEFORE UPDATE ON public.staff_shifts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_staff_performance_reviews_updated_at
BEFORE UPDATE ON public.staff_performance_reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Function to calculate working hours
CREATE OR REPLACE FUNCTION calculate_staff_working_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_hours_before_update
BEFORE UPDATE ON public.staff_attendance
FOR EACH ROW
WHEN (NEW.check_out IS NOT NULL)
EXECUTE FUNCTION calculate_staff_working_hours();

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff
CREATE POLICY "Authenticated users can view staff"
ON public.staff
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can view their own records"
ON public.staff
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin can update staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (auth.role() = 'service_role');

-- Create RLS policies for staff_documents
CREATE POLICY "Staff can view their own documents"
ON public.staff_documents
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.staff
  WHERE staff.id = staff_documents.staff_id
  AND staff.user_id = auth.uid()
));

-- Create RLS policies for staff_attendance
CREATE POLICY "Staff can view their own attendance"
ON public.staff_attendance
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.staff
  WHERE staff.id = staff_attendance.staff_id
  AND staff.user_id = auth.uid()
));

-- Create RLS policies for staff_shifts
CREATE POLICY "Staff can view their own shifts"
ON public.staff_shifts
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.staff
  WHERE staff.id = staff_shifts.staff_id
  AND staff.user_id = auth.uid()
));

-- Create RLS policies for staff_performance_reviews
CREATE POLICY "Staff can view their own performance reviews"
ON public.staff_performance_reviews
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.staff
  WHERE staff.id = staff_performance_reviews.staff_id
  AND staff.user_id = auth.uid()
));

-- Grant permissions
GRANT ALL ON public.staff TO authenticated;
GRANT ALL ON public.staff_documents TO authenticated;
GRANT ALL ON public.staff_attendance TO authenticated;
GRANT ALL ON public.staff_shifts TO authenticated;
GRANT ALL ON public.staff_performance_reviews TO authenticated;
