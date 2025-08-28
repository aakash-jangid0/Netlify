-- Staff Management Tables
-- Staff, Staff Attendance, Staff Communications, Staff Documents, Staff Leave, Staff Payroll, Staff Performance, Staff Performance Reviews, Staff Shifts, Staff Training, Staff Activity Logs
-- Date: 2025-08-24

CREATE TABLE IF NOT EXISTS staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  role staff_role NOT NULL,
  department staff_department NOT NULL,
  start_date date NOT NULL,
  profile_photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  hire_status text DEFAULT 'active'::text,
  contract_type text DEFAULT 'permanent'::text,
  probation_end_date date,
  notice_period interval DEFAULT '30 days'::interval,
  skills text[],
  certifications jsonb DEFAULT '[]'::jsonb,
  performance_score numeric,
  leave_balance jsonb DEFAULT '{"sick": 10, "annual": 20}'::jsonb,
  date_of_birth date,
  national_id text,
  gender text,
  marital_status text,
  blood_group text,
  nationality text,
  employee_id text,
  joining_date date,
  employment_history text,
  base_salary numeric,
  hourly_rate numeric,
  payment_schedule text DEFAULT 'monthly'::text,
  bank_name text,
  bank_account text,
  tax_id text,
  bonus numeric,
  deductions numeric,
  net_salary numeric,
  working_hours_per_week numeric DEFAULT 40,
  default_shift text DEFAULT 'day'::text,
  weekend_availability boolean DEFAULT false,
  overtime_eligible boolean DEFAULT true,
  time_off_accrual_rate numeric DEFAULT 1.5,
  annual_leave_balance numeric DEFAULT 20,
  sick_leave_balance numeric DEFAULT 10,
  leave_start_date date,
  leave_end_date date,
  leave_reason text,
  last_evaluation_date date,
  evaluation_score numeric,
  next_evaluation_date date,
  performance_notes text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  check_in timestamp with time zone NOT NULL,
  check_out timestamp with time zone,
  total_hours numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  staff_name text,
  status text DEFAULT 'present'::text,
  date date DEFAULT CURRENT_DATE,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_communications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid,
  recipient_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  priority text DEFAULT 'normal'::text,
  category text,
  attachment_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  expiry_date date,
  is_verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_leave (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status leave_status DEFAULT 'pending'::leave_status,
  reason text,
  approved_by uuid,
  approved_at timestamp with time zone,
  attachment_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  base_salary numeric NOT NULL,
  hourly_rate numeric,
  bank_account text,
  tax_information jsonb,
  allowances jsonb DEFAULT '{}'::jsonb,
  deductions jsonb DEFAULT '{}'::jsonb,
  payment_schedule text DEFAULT 'monthly'::text,
  last_payment_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  review_date date NOT NULL,
  reviewer_id uuid,
  rating performance_rating NOT NULL,
  goals_achieved jsonb DEFAULT '[]'::jsonb,
  areas_of_improvement text[],
  comments text,
  next_review_date date,
  acknowledgement_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_performance_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  review_date timestamp with time zone DEFAULT now(),
  rating performance_rating NOT NULL,
  goals_achieved text[] DEFAULT '{}'::text[],
  areas_of_improvement text[] DEFAULT '{}'::text[],
  comments text,
  next_review_date timestamp with time zone,
  reviewer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  shift_type shift_type NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  break_duration interval DEFAULT '00:30:00'::interval,
  is_published boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  shift_date date,
  total_hours numeric,
  status text DEFAULT 'scheduled'::text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_training (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  training_name text NOT NULL,
  description text,
  completion_date date,
  expiry_date date,
  certificate_url text,
  training_provider text,
  status text DEFAULT 'pending'::text,
  score numeric,
  is_mandatory boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Staff management indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);
