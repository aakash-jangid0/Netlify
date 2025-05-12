/*
  # Enhance Staff Management System

  1. New Tables
    - `staff_shifts` - Manage staff schedules and shifts
    - `staff_performance` - Track staff performance reviews
    - `staff_training` - Track training and certifications
    - `staff_payroll` - Manage payroll information
    - `staff_leave` - Track leave requests and balances
    - `staff_documents` - Store staff documents
    - `staff_communications` - Internal communication system
*/

-- Create shift types
CREATE TYPE shift_type AS ENUM (
  'morning',
  'afternoon',
  'evening',
  'night'
);

-- Create leave types
CREATE TYPE leave_type AS ENUM (
  'annual',
  'sick',
  'personal',
  'unpaid',
  'bereavement',
  'maternity',
  'paternity'
);

-- Create leave status
CREATE TYPE leave_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

-- Create performance rating
CREATE TYPE performance_rating AS ENUM (
  'excellent',
  'good',
  'satisfactory',
  'needs_improvement',
  'unsatisfactory'
);

-- Staff Shifts Table
CREATE TABLE staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  shift_type shift_type NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  break_duration interval DEFAULT '30 minutes',
  is_published boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_shift_times CHECK (end_time > start_time)
);

-- Staff Performance Table
CREATE TABLE staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  reviewer_id uuid REFERENCES staff(id),
  rating performance_rating NOT NULL,
  goals_achieved jsonb DEFAULT '[]',
  areas_of_improvement text[],
  comments text,
  next_review_date date,
  acknowledgement_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Training Table
CREATE TABLE staff_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  training_name text NOT NULL,
  description text,
  completion_date date,
  expiry_date date,
  certificate_url text,
  training_provider text,
  status text DEFAULT 'pending',
  score numeric,
  is_mandatory boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Payroll Table
CREATE TABLE staff_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  base_salary numeric NOT NULL,
  hourly_rate numeric,
  bank_account text,
  tax_information jsonb,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  payment_schedule text DEFAULT 'monthly',
  last_payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Leave Table
CREATE TABLE staff_leave (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status leave_status DEFAULT 'pending',
  reason text,
  approved_by uuid REFERENCES staff(id),
  approved_at timestamptz,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_leave_dates CHECK (end_date >= start_date)
);

-- Staff Documents Table
CREATE TABLE staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  expiry_date date,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES staff(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Communications Table
CREATE TABLE staff_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  priority text DEFAULT 'normal',
  category text,
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to staff table
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS hire_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS probation_end_date date,
  ADD COLUMN IF NOT EXISTS notice_period interval DEFAULT '30 days',
  ADD COLUMN IF NOT EXISTS skills text[],
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS performance_score numeric,
  ADD COLUMN IF NOT EXISTS leave_balance jsonb DEFAULT '{"annual": 20, "sick": 10}';

-- Enable RLS
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_communications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX staff_shifts_staff_id_idx ON staff_shifts(staff_id);
CREATE INDEX staff_shifts_date_idx ON staff_shifts(start_time);
CREATE INDEX staff_performance_staff_id_idx ON staff_performance(staff_id);
CREATE INDEX staff_training_staff_id_idx ON staff_training(staff_id);
CREATE INDEX staff_payroll_staff_id_idx ON staff_payroll(staff_id);
CREATE INDEX staff_leave_staff_id_idx ON staff_leave(staff_id);
CREATE INDEX staff_leave_status_idx ON staff_leave(status);
CREATE INDEX staff_documents_staff_id_idx ON staff_documents(staff_id);
CREATE INDEX staff_communications_sender_id_idx ON staff_communications(sender_id);
CREATE INDEX staff_communications_recipient_id_idx ON staff_communications(recipient_id);

-- RLS Policies
CREATE POLICY "Staff can view own shifts"
  ON staff_shifts FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own performance"
  ON staff_performance FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own training"
  ON staff_training FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own payroll"
  ON staff_payroll FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage own leave"
  ON staff_leave FOR ALL
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view own documents"
  ON staff_documents FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage own communications"
  ON staff_communications FOR ALL
  TO authenticated
  USING (sender_id IN (SELECT id FROM staff WHERE user_id = auth.uid()) OR 
         recipient_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Functions and Triggers

-- Function to update leave balance
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE staff
    SET leave_balance = jsonb_set(
      leave_balance,
      ARRAY[NEW.leave_type::text],
      (COALESCE((leave_balance->>NEW.leave_type::text)::numeric, 0) - 
       (NEW.end_date - NEW.start_date + 1))::text::jsonb
    )
    WHERE id = NEW.staff_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating leave balance
CREATE TRIGGER update_leave_balance_trigger
  AFTER UPDATE OF status ON staff_leave
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_leave_balance();

-- Function to calculate performance score
CREATE OR REPLACE FUNCTION calculate_performance_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE staff
  SET performance_score = (
    SELECT AVG(
      CASE rating
        WHEN 'excellent' THEN 5
        WHEN 'good' THEN 4
        WHEN 'satisfactory' THEN 3
        WHEN 'needs_improvement' THEN 2
        WHEN 'unsatisfactory' THEN 1
      END
    )
    FROM staff_performance
    WHERE staff_id = NEW.staff_id
  )
  WHERE id = NEW.staff_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating performance score
CREATE TRIGGER calculate_performance_score_trigger
  AFTER INSERT OR UPDATE ON staff_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_performance_score();