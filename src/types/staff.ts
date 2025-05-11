// This file defines TypeScript interfaces for the Staff tables

export interface Staff {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'manager' | 'chef' | 'server' | 'cashier';
  department: 'kitchen' | 'service' | 'management' | 'accounts';
  start_date: string;
  profile_photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional personal information
  date_of_birth?: string;
  national_id?: string;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  nationality?: string;
  
  // Employment details
  employee_id?: string;
  contract_type?: 'permanent' | 'contract' | 'part-time' | 'probation';
  hire_status?: 'active' | 'on-leave' | 'terminated' | 'resigned';
  probation_end_date?: string;
  notice_period?: string;
  skills?: string[];
  joining_date?: string;
  employment_history?: string;
  
  // Salary information
  base_salary?: number;
  hourly_rate?: number;
  payment_schedule?: 'weekly' | 'biweekly' | 'monthly';
  bank_name?: string;
  bank_account?: string;
  tax_id?: string;
  bonus?: number;
  deductions?: number;
  net_salary?: number;
  
  // Attendance & working hours
  working_hours_per_week?: number;
  default_shift?: 'day' | 'night' | 'morning' | 'evening';
  weekend_availability?: boolean;
  overtime_eligible?: boolean;
  time_off_accrual_rate?: number;
  
  // Leave management
  annual_leave_balance?: number;
  sick_leave_balance?: number;
  leave_start_date?: string;
  leave_end_date?: string;
  leave_reason?: string;
  
  // Performance
  last_evaluation_date?: string;
  evaluation_score?: number;
  next_evaluation_date?: string;
  performance_notes?: string;
  performance_score?: number;
}

export interface StaffDocument {
  id: string;
  staff_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  expiry_date?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  check_in: string;
  check_out?: string;
  total_hours?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffPerformance {
  id: string;
  staff_id: string;
  review_date: string;
  reviewer_id?: string;
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  goals_achieved: string[];
  areas_of_improvement: string[];
  comments?: string;
  next_review_date?: string;
  acknowledgement_date?: string;
  created_at?: string;
  updated_at?: string;
  reviewer_name?: string; // Added for UI display
}

export interface StaffShift {
  id: string;
  staff_id: string;
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night';
  start_time: string;
  end_time: string;
  break_duration?: string;
  is_published: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffLeave {
  id: string;
  staff_id: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'unpaid' | 'bereavement' | 'maternity' | 'paternity';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  approved_by?: string;
  approved_at?: string;
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}
