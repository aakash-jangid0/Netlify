/*
  # Add staff management schema

  1. New Tables
    - `staff`
      - Store staff member details and employment information
      - Track access levels and permissions
    
    - `staff_activity_logs`
      - Record staff actions and system events
      - Track login history and changes

    - `staff_attendance`
      - Track staff attendance and work hours
      - Record check-in/check-out times

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create staff roles type
CREATE TYPE staff_role AS ENUM (
  'admin',
  'manager',
  'chef',
  'server',
  'cashier'
);

-- Create staff departments type
CREATE TYPE staff_department AS ENUM (
  'kitchen',
  'service',
  'management',
  'accounts'
);

-- Create staff table
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
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
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create staff activity logs table
CREATE TABLE staff_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create staff attendance table
CREATE TABLE staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  check_in timestamptz NOT NULL,
  check_out timestamptz,
  total_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Staff members can view own profile"
  ON staff FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create policies for activity logs
CREATE POLICY "Staff can view own activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create policies for attendance
CREATE POLICY "Staff can view own attendance"
  ON staff_attendance FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can record own attendance"
  ON staff_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX staff_user_id_idx ON staff(user_id);
CREATE INDEX staff_role_idx ON staff(role);
CREATE INDEX staff_department_idx ON staff(department);
CREATE INDEX staff_activity_logs_staff_id_idx ON staff_activity_logs(staff_id);
CREATE INDEX staff_activity_logs_created_at_idx ON staff_activity_logs(created_at);
CREATE INDEX staff_attendance_staff_id_idx ON staff_attendance(staff_id);
CREATE INDEX staff_attendance_check_in_idx ON staff_attendance(check_in);

-- Function to log staff activity
CREATE OR REPLACE FUNCTION log_staff_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO staff_activity_logs (
    staff_id,
    action_type,
    action_details,
    ip_address
  ) VALUES (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    ),
    current_setting('request.headers')::jsonb->>'x-forwarded-for'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
CREATE TRIGGER log_staff_changes
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION log_staff_activity();

-- Function to calculate attendance hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculating attendance hours
CREATE TRIGGER calculate_attendance_hours_trigger
  BEFORE INSERT OR UPDATE ON staff_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_hours();