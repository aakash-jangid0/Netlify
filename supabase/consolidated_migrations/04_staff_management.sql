/*
  # Staff Management Migration
  
  Creates staff tables and related functionality
  
  Generated: 2025-05-12T12:10:13.933Z
*/

-- Alter tables

-- From: 20240514000000_fix_staff_documents_performance.sql
ALTER TABLE public.staff_performance_reviews ENABLE ROW LEVEL SECURITY;

-- From: 20250505122407_rough_salad.sql
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- From: 20250510200000_setup_attendance_shifts.sql
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

-- From: 20250510200000_setup_attendance_shifts.sql
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

-- From: 20250510200000_setup_attendance_shifts.sql
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- From: 20250510_fix_staff_tables.sql
ALTER TABLE public.staff ADD CONSTRAINT staff_employee_id_unique UNIQUE (employee_id) DEFERRABLE INITIALLY DEFERRED;

-- From: 20250510_fix_staff_tables.sql
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- From: 20250510_fix_staff_tables.sql
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- From: 20250510_fix_staff_tables.sql
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- From: 20250510_fix_staff_tables.sql
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- From: 20250511000000_setup_attendance_system.sql
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
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- From: 20250511000001_setup_shift_scheduler.sql
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

