-- Staff Database Fix Migration
-- This migration ensures that the staff tables are correctly set up
-- and fixes any inconsistencies in the database structure

-- Create the staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'chef', 'server', 'cashier')),
  department TEXT NOT NULL CHECK (department IN ('kitchen', 'service', 'management', 'accounts')),
  start_date DATE NOT NULL,
  profile_photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Personal Information
  date_of_birth DATE,
  national_id TEXT,
  gender TEXT,
  marital_status TEXT,
  blood_group TEXT,
  nationality TEXT,
  
  -- Employment Details
  employee_id TEXT,
  contract_type TEXT DEFAULT 'permanent',
  hire_status TEXT DEFAULT 'active',
  probation_end_date DATE,
  notice_period TEXT DEFAULT '30 days',
  skills TEXT[],
  joining_date DATE,
  employment_history TEXT,
  
  -- Salary Information
  base_salary NUMERIC,
  hourly_rate NUMERIC,
  payment_schedule TEXT DEFAULT 'monthly',
  bank_name TEXT,
  bank_account TEXT,
  tax_id TEXT,
  bonus NUMERIC,
  deductions NUMERIC,
  net_salary NUMERIC,
  
  -- Attendance & Working Hours
  working_hours_per_week NUMERIC DEFAULT 40,
  default_shift TEXT DEFAULT 'day',
  weekend_availability BOOLEAN DEFAULT false,
  overtime_eligible BOOLEAN DEFAULT true,
  time_off_accrual_rate NUMERIC DEFAULT 1.5,
  annual_leave_balance NUMERIC DEFAULT 20,
  sick_leave_balance NUMERIC DEFAULT 10,
  leave_start_date DATE,
  leave_end_date DATE,
  leave_reason TEXT,
  
  -- Performance
  last_evaluation_date DATE,
  evaluation_score NUMERIC,
  next_evaluation_date DATE,
  performance_notes TEXT,
  performance_score NUMERIC DEFAULT 0
);

-- Create staff documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  notes TEXT
);

-- Create staff shifts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 30,
  total_hours NUMERIC,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  hours_worked NUMERIC,
  status TEXT DEFAULT 'present',
  notes TEXT,
  UNIQUE(staff_id, date)
);

-- Fix potential issues with existing tables
-- Ensure employee_id is unique if present
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_employee_id_unique;
ALTER TABLE public.staff ADD CONSTRAINT staff_employee_id_unique UNIQUE (employee_id) DEFERRABLE INITIALLY DEFERRED;

-- Update the staff table with any missing columns
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_staff_updated_at ON public.staff;
CREATE TRIGGER set_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add foreign key from staff to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'staff' AND column_name = 'user_id'
  ) THEN
    -- Add FK constraint only if it doesn't exist
    BEGIN
      ALTER TABLE public.staff
      ADD CONSTRAINT staff_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Constraint already exists
    END;
  END IF;
END
$$;

-- Create RLS policies for staff table if they don't exist
DO $$
BEGIN
  -- Enable RLS on tables
  ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
  
  -- Admin can see all staff
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'admin_select_policy') THEN
    CREATE POLICY admin_select_policy ON public.staff
      FOR SELECT
      USING (
        auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'admin')
        OR auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'manager')
      );
  END IF;

  -- Staff can see their own records
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'staff_select_own_policy') THEN
    CREATE POLICY staff_select_own_policy ON public.staff
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  -- Only admin/manager can insert staff
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'admin_insert_policy') THEN
    CREATE POLICY admin_insert_policy ON public.staff
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'admin')
        OR auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'manager')
      );
  END IF;
  
  -- Admin/manager can update any staff, others can only update their own record
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'staff_update_policy') THEN
    CREATE POLICY staff_update_policy ON public.staff
      FOR UPDATE
      USING (
        auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'admin')
        OR auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'manager')
        OR auth.uid() = user_id
      );
  END IF;
  
  -- Only admin can delete staff
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff' AND policyname = 'admin_delete_policy') THEN
    CREATE POLICY admin_delete_policy ON public.staff
      FOR DELETE
      USING (auth.uid() IN (SELECT user_id FROM public.staff WHERE role = 'admin'));
  END IF;
END
$$;
