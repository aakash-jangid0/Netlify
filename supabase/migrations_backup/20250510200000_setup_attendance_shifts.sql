/*
  # Staff Attendance and Shift Management System Setup
  
  This migration:
  1. Ensures the staff_attendance table exists with proper schema
  2. Ensures the staff_shifts table exists with proper schema
  3. Sets up proper RLS policies for both tables
  4. Creates necessary indexes for performance
*/

-- Function to create or update tables as needed
DO $$
BEGIN
  -- STAFF ATTENDANCE TABLE
  -- Check if staff_attendance table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_attendance') THEN
    -- Create the staff_attendance table
    CREATE TABLE public.staff_attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
      staff_name TEXT, -- Denormalized for performance
      check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      check_out TIMESTAMP WITH TIME ZONE,
      status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
      total_hours NUMERIC,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Create indexes for performance
    CREATE INDEX idx_staff_attendance_staff_id ON public.staff_attendance(staff_id);
    CREATE INDEX idx_staff_attendance_check_in ON public.staff_attendance(check_in);
    CREATE INDEX idx_staff_attendance_status ON public.staff_attendance(status);
    
  ELSE
    -- Ensure the staff_attendance table has all required columns
    BEGIN
      ALTER TABLE public.staff_attendance 
        ADD COLUMN IF NOT EXISTS staff_name TEXT,
        ADD COLUMN IF NOT EXISTS check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS check_out TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present',
        ADD COLUMN IF NOT EXISTS total_hours NUMERIC,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    EXCEPTION WHEN OTHERS THEN
      -- Safely handle column already exists errors
      RAISE NOTICE 'Column modification error in staff_attendance: %', SQLERRM;
    END;
  END IF;

  -- STAFF SHIFTS TABLE
  -- Check if staff_shifts table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_shifts') THEN
    -- Create staff_shifts table
    CREATE TABLE public.staff_shifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
      shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night')),
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE NOT NULL,
      break_duration TEXT DEFAULT '30',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT valid_shift_time_range CHECK (end_time > start_time)
    );

    -- Create indexes for performance
    CREATE INDEX idx_staff_shifts_staff_id ON public.staff_shifts(staff_id);
    CREATE INDEX idx_staff_shifts_start_time ON public.staff_shifts(start_time);
    CREATE INDEX idx_staff_shifts_shift_type ON public.staff_shifts(shift_type);
    
  ELSE
    -- Ensure the staff_shifts table has all required columns
    BEGIN
      ALTER TABLE public.staff_shifts 
        ADD COLUMN IF NOT EXISTS shift_type TEXT,
        ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS break_duration TEXT DEFAULT '30',
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    EXCEPTION WHEN OTHERS THEN
      -- Safely handle column already exists errors
      RAISE NOTICE 'Column modification error in staff_shifts: %', SQLERRM;
    END;
  END IF;
END
$$;

-- Enable Row Level Security for both tables
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view their own attendance" ON public.staff_attendance;
DROP POLICY IF EXISTS "Admin can view all attendance" ON public.staff_attendance;
DROP POLICY IF EXISTS "Admin can manage all attendance" ON public.staff_attendance;

DROP POLICY IF EXISTS "Staff can view their own shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can view all shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can manage all shifts" ON public.staff_shifts;

-- Create RLS policies for staff_attendance
-- Admins can perform all actions
CREATE POLICY "Admin can manage all attendance" 
ON public.staff_attendance FOR ALL 
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

-- Staff can view their own attendance records
CREATE POLICY "Staff can view their own attendance" 
ON public.staff_attendance FOR SELECT 
TO authenticated
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for staff_shifts
-- Admins can perform all actions
CREATE POLICY "Admin can manage all shifts" 
ON public.staff_shifts FOR ALL 
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

-- Staff can view their own shifts
CREATE POLICY "Staff can view their own shifts" 
ON public.staff_shifts FOR SELECT 
TO authenticated
USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- Create a trigger to update the staff_name in attendance records when staff names change
CREATE OR REPLACE FUNCTION update_staff_name_in_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update staff_name in all attendance records for this staff member
  UPDATE public.staff_attendance
  SET staff_name = NEW.full_name
  WHERE staff_id = NEW.id AND (staff_name IS NULL OR staff_name != NEW.full_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_staff_name_trigger ON public.staff;

-- Create the trigger
CREATE TRIGGER update_staff_name_trigger
AFTER UPDATE OF full_name ON public.staff
FOR EACH ROW
EXECUTE FUNCTION update_staff_name_in_attendance();

-- Create function to calculate total hours when check-out occurs
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out IS NOT NULL AND NEW.check_in IS NOT NULL THEN
    -- Calculate hours between check-in and check-out
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS calculate_hours_trigger ON public.staff_attendance;

-- Create the trigger
CREATE TRIGGER calculate_hours_trigger
BEFORE INSERT OR UPDATE OF check_out ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_hours();

-- Add staff_name to new attendance records automatically
CREATE OR REPLACE FUNCTION add_staff_name_to_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the staff name and add it to the attendance record
  IF NEW.staff_name IS NULL THEN
    SELECT full_name INTO NEW.staff_name
    FROM public.staff
    WHERE id = NEW.staff_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS add_staff_name_trigger ON public.staff_attendance;

-- Create the trigger
CREATE TRIGGER add_staff_name_trigger
BEFORE INSERT ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION add_staff_name_to_attendance();
