/*
  # Staff Database Enhancement Migration
  
  This migration:
  1. Adds missing fields to the staff table needed by the StaffForm component
  2. Creates sample staff data to test the staff dashboard functionality
*/

-- Add missing fields to staff table
ALTER TABLE staff 
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS hire_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS probation_end_date date,
  ADD COLUMN IF NOT EXISTS notice_period text DEFAULT '30 days',
  ADD COLUMN IF NOT EXISTS skills text[],
  ADD COLUMN IF NOT EXISTS joining_date date,
  ADD COLUMN IF NOT EXISTS employment_history text,
  ADD COLUMN IF NOT EXISTS base_salary numeric,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS payment_schedule text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS bonus numeric,
  ADD COLUMN IF NOT EXISTS deductions numeric,
  ADD COLUMN IF NOT EXISTS net_salary numeric,
  ADD COLUMN IF NOT EXISTS working_hours_per_week numeric DEFAULT 40,
  ADD COLUMN IF NOT EXISTS default_shift text DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS weekend_availability boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS overtime_eligible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS time_off_accrual_rate numeric DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS annual_leave_balance numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS sick_leave_balance numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS leave_start_date date,
  ADD COLUMN IF NOT EXISTS leave_end_date date,
  ADD COLUMN IF NOT EXISTS leave_reason text,
  ADD COLUMN IF NOT EXISTS last_evaluation_date date,
  ADD COLUMN IF NOT EXISTS evaluation_score numeric,
  ADD COLUMN IF NOT EXISTS next_evaluation_date date,
  ADD COLUMN IF NOT EXISTS performance_notes text,
  ADD COLUMN IF NOT EXISTS performance_score numeric DEFAULT 0;

-- Clean any existing staff data for a fresh start
DELETE FROM staff;

-- Insert sample staff data
INSERT INTO staff (
  full_name, 
  email, 
  phone, 
  role, 
  department, 
  start_date, 
  address,
  employee_id,
  profile_photo_url,
  gender,
  nationality,
  date_of_birth,
  marital_status,
  base_salary,
  hourly_rate,
  skills,
  performance_score,
  contract_type,
  hire_status,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation
) VALUES 
-- Admin
(
  'John Smith', 
  'john.smith@restaurant.com', 
  '+1-555-123-4567', 
  'admin', 
  'management', 
  '2023-01-15',
  '123 Main St, Anytown, CA 90210',
  'EMP001',
  'https://randomuser.me/api/portraits/men/1.jpg',
  'male',
  'American',
  '1985-06-12',
  'married',
  95000,
  NULL,
  ARRAY['leadership', 'operations', 'finance', 'restaurant management'],
  90,
  'permanent',
  'active',
  'Sarah Smith',
  '+1-555-987-6543',
  'spouse'
),
-- Manager
(
  'Emily Johnson', 
  'emily.johnson@restaurant.com', 
  '+1-555-234-5678', 
  'manager', 
  'management', 
  '2023-03-10',
  '456 Oak St, Smallville, CA 90211',
  'EMP002',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'female',
  'American',
  '1990-03-25',
  'single',
  72000,
  NULL,
  ARRAY['team leadership', 'scheduling', 'customer service', 'conflict resolution'],
  85,
  'permanent',
  'active',
  'Michael Johnson',
  '+1-555-876-5432',
  'father'
),
-- Chef
(
  'Marco Rodriguez', 
  'marco.rodriguez@restaurant.com', 
  '+1-555-345-6789', 
  'chef', 
  'kitchen', 
  '2023-02-05',
  '789 Pine Ave, Riverside, CA 90212',
  'EMP003',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'male',
  'Mexican',
  '1988-11-08',
  'married',
  68000,
  32.50,
  ARRAY['italian cuisine', 'pastry', 'menu development', 'kitchen management'],
  92,
  'permanent',
  'active',
  'Lisa Rodriguez',
  '+1-555-765-4321',
  'spouse'
),
-- Chef
(
  'Aisha Patel', 
  'aisha.patel@restaurant.com', 
  '+1-555-456-7890', 
  'chef', 
  'kitchen', 
  '2023-04-18',
  '101 Cedar St, Westville, CA 90213',
  'EMP004',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'female',
  'Indian',
  '1992-02-14',
  'single',
  64000,
  30.75,
  ARRAY['indian cuisine', 'vegetarian', 'spices', 'food presentation'],
  87,
  'permanent',
  'active',
  'Raj Patel',
  '+1-555-654-3210',
  'brother'
),
-- Server
(
  'David Kim', 
  'david.kim@restaurant.com', 
  '+1-555-567-8901', 
  'server', 
  'service', 
  '2023-05-22',
  '202 Maple Rd, Eastside, CA 90214',
  'EMP005',
  'https://randomuser.me/api/portraits/men/5.jpg',
  'male',
  'Korean',
  '1995-07-30',
  'single',
  NULL,
  18.50,
  ARRAY['customer service', 'wine knowledge', 'upselling', 'POS systems'],
  78,
  'part-time',
  'active',
  'Jenny Kim',
  '+1-555-543-2109',
  'sister'
),
-- Server
(
  'Sophia Martinez', 
  'sophia.martinez@restaurant.com', 
  '+1-555-678-9012', 
  'server', 
  'service', 
  '2023-06-15',
  '303 Birch Dr, Northend, CA 90215',
  'EMP006',
  'https://randomuser.me/api/portraits/women/6.jpg',
  'female',
  'Hispanic',
  '1997-05-12',
  'single',
  NULL,
  18.75,
  ARRAY['customer service', 'cocktail knowledge', 'spanish language', 'problem solving'],
  82,
  'part-time',
  'active',
  'Luis Martinez',
  '+1-555-432-1098',
  'father'
),
-- Cashier
(
  'James Wilson', 
  'james.wilson@restaurant.com', 
  '+1-555-789-0123', 
  'cashier', 
  'service', 
  '2023-07-08',
  '404 Spruce Way, Southside, CA 90216',
  'EMP007',
  'https://randomuser.me/api/portraits/men/7.jpg',
  'male',
  'American',
  '1999-09-20',
  'single',
  NULL,
  16.50,
  ARRAY['cash handling', 'customer service', 'POS systems', 'basic accounting'],
  75,
  'contract',
  'active',
  'Mary Wilson',
  '+1-555-321-0987',
  'mother'
),
-- Cashier
(
  'Olivia Thompson', 
  'olivia.thompson@restaurant.com', 
  '+1-555-890-1234', 
  'cashier', 
  'service', 
  '2023-08-14',
  '505 Elm Court, Westside, CA 90217',
  'EMP008',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'female',
  'American',
  '1996-12-03',
  'single',
  NULL,
  16.75,
  ARRAY['cash handling', 'customer service', 'conflict resolution'],
  76,
  'contract',
  'active',
  'Robert Thompson',
  '+1-555-210-9876',
  'father'
),
-- Server
(
  'Michael Zhang', 
  'michael.zhang@restaurant.com', 
  '+1-555-901-2345', 
  'server', 
  'service', 
  '2023-09-05',
  '606 Willow Lane, Downtown, CA 90218',
  'EMP009',
  'https://randomuser.me/api/portraits/men/9.jpg',
  'male',
  'Chinese',
  '1994-04-17',
  'single',
  NULL,
  19.00,
  ARRAY['customer service', 'mandarin language', 'wine knowledge'],
  80,
  'permanent',
  'active',
  'Wei Zhang',
  '+1-555-109-8765',
  'father'
),
-- Manager
(
  'Grace Lee', 
  'grace.lee@restaurant.com', 
  '+1-555-012-3456', 
  'manager', 
  'accounts', 
  '2023-10-12',
  '707 Aspen Ave, Uptown, CA 90219',
  'EMP010',
  'https://randomuser.me/api/portraits/women/10.jpg',
  'female',
  'Korean',
  '1989-08-22',
  'married',
  70000,
  NULL,
  ARRAY['accounting', 'finance', 'payroll management', 'inventory control'],
  88,
  'permanent',
  'active',
  'Daniel Lee',
  '+1-555-098-7654',
  'spouse'
);

-- Create document types
DO $$
DECLARE 
  staff_record RECORD;
BEGIN
  -- Add some sample documents for each staff member
  FOR staff_record IN SELECT id, full_name FROM staff LOOP
    -- ID Document
    INSERT INTO staff_documents (
      staff_id,
      document_type,
      document_name,
      document_url,
      is_verified,
      created_at
    ) VALUES (
      staff_record.id,
      'identification',
      'ID Card - ' || staff_record.full_name,
      'https://example.com/documents/id/' || REPLACE(staff_record.full_name, ' ', '_') || '.pdf',
      TRUE,
      NOW() - (RANDOM() * INTERVAL '30 days')
    );
    
    -- Contract
    INSERT INTO staff_documents (
      staff_id,
      document_type,
      document_name,
      document_url,
      is_verified,
      created_at
    ) VALUES (
      staff_record.id,
      'contract',
      'Employment Contract - ' || staff_record.full_name,
      'https://example.com/documents/contracts/' || REPLACE(staff_record.full_name, ' ', '_') || '.pdf',
      TRUE,
      NOW() - (RANDOM() * INTERVAL '30 days')
    );
    
    -- Health Certificate (for kitchen staff)
    IF EXISTS (SELECT 1 FROM staff WHERE id = staff_record.id AND department = 'kitchen') THEN
      INSERT INTO staff_documents (
        staff_id,
        document_type,
        document_name,
        document_url,
        expiry_date,
        is_verified,
        created_at
      ) VALUES (
        staff_record.id,
        'certificate',
        'Health Certificate - ' || staff_record.full_name,
        'https://example.com/documents/certificates/' || REPLACE(staff_record.full_name, ' ', '_') || '.pdf',
        NOW() + INTERVAL '1 year',
        TRUE,
        NOW() - (RANDOM() * INTERVAL '30 days')
      );
    END IF;
  END LOOP;
END $$;

-- Add RLS policies for security
CREATE POLICY "Authenticated users can view staff"
  ON staff
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin users can manage staff"
  ON staff
  USING (auth.role() IN ('service_role', 'authenticated') AND EXISTS (
    SELECT 1 FROM staff s
    WHERE s.user_id = auth.uid() AND s.role = 'admin'
  ));
  
CREATE POLICY "Staff can view their own documents"
  ON staff_documents
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM staff WHERE id = staff_documents.staff_id
    )
  );

CREATE POLICY "Admin can view all staff documents"
  ON staff_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
