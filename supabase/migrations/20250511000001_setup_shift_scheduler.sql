/*
  # Staff Shift Scheduling System Setup
  
  This migration:
  1. Ensures the staff_shifts table exists with proper schema
  2. Sets up proper RLS policies for the table
  3. Creates necessary indexes and constraints for efficient scheduling
  4. Sets up validation rules for shift times
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create or update tables as needed
DO $$
BEGIN
  -- Check if staff_shifts table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_shifts') THEN
    -- Create staff_shifts table
    CREATE TABLE public.staff_shifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
      shift_type TEXT CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night')),
      shift_date DATE NOT NULL,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE NOT NULL,
      break_duration INTEGER DEFAULT 30,
      total_hours NUMERIC,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT valid_shift_time_range CHECK (end_time > start_time)
    );

    -- Create indexes for performance
    CREATE INDEX idx_staff_shifts_staff_id ON public.staff_shifts(staff_id);
    CREATE INDEX idx_staff_shifts_shift_date ON public.staff_shifts(shift_date);
    CREATE INDEX idx_staff_shifts_start_time ON public.staff_shifts(start_time);
    CREATE INDEX idx_staff_shifts_shift_type ON public.staff_shifts(shift_type);
  ELSE
    -- Ensure the staff_shifts table has all required columns
    BEGIN
      ALTER TABLE public.staff_shifts 
        ADD COLUMN IF NOT EXISTS shift_type TEXT,
        ADD COLUMN IF NOT EXISTS shift_date DATE,
        ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS total_hours NUMERIC,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        
      -- Add constraint if it doesn't exist
      BEGIN
        ALTER TABLE public.staff_shifts
        ADD CONSTRAINT valid_shift_time_range CHECK (end_time > start_time);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Constraint already exists or other error: %', SQLERRM;
      END;
    EXCEPTION WHEN OTHERS THEN
      -- Safely handle column already exists errors
      RAISE NOTICE 'Column modification error in staff_shifts: %', SQLERRM;
    END;
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can view their own shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can manage all shifts" ON public.staff_shifts;

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

-- Function to calculate total hours for shifts
CREATE OR REPLACE FUNCTION calculate_shift_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- Calculate total hours (excluding break)
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600;
    
    -- Subtract break duration if specified
    IF NEW.break_duration IS NOT NULL AND NEW.break_duration > 0 THEN
      NEW.total_hours = NEW.total_hours - (NEW.break_duration / 60.0);
    END IF;
    
    -- Ensure total hours is not negative
    IF NEW.total_hours < 0 THEN
      NEW.total_hours = 0;
    END IF;
  END IF;
  
  -- Ensure shift_date matches the date part of start_time if not explicitly set
  IF NEW.shift_date IS NULL AND NEW.start_time IS NOT NULL THEN
    NEW.shift_date = DATE(NEW.start_time AT TIME ZONE 'UTC');
  END IF;
  
  -- Set shift type based on start time if not specified
  IF NEW.shift_type IS NULL AND NEW.start_time IS NOT NULL THEN
    NEW.shift_type = 
      CASE 
        WHEN EXTRACT(HOUR FROM NEW.start_time) >= 5 AND EXTRACT(HOUR FROM NEW.start_time) < 12 THEN 'morning'
        WHEN EXTRACT(HOUR FROM NEW.start_time) >= 12 AND EXTRACT(HOUR FROM NEW.start_time) < 17 THEN 'afternoon'
        WHEN EXTRACT(HOUR FROM NEW.start_time) >= 17 AND EXTRACT(HOUR FROM NEW.start_time) < 22 THEN 'evening'
        ELSE 'night'
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS calculate_shift_hours_trigger ON public.staff_shifts;

-- Create the trigger
CREATE TRIGGER calculate_shift_hours_trigger
BEFORE INSERT OR UPDATE OF start_time, end_time, break_duration ON public.staff_shifts
FOR EACH ROW
EXECUTE FUNCTION calculate_shift_hours();
