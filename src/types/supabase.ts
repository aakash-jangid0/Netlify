export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          phone: string | null
          address: string | null
          role: string
          department: string
          start_date: string
          profile_photo_url: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          is_active: boolean
          last_login: string | null
          date_of_birth: string | null
          national_id: string | null
          gender: string | null
          marital_status: string | null
          blood_group: string | null
          nationality: string | null
          employee_id: string | null
          contract_type: string | null
          hire_status: string | null
          probation_end_date: string | null
          notice_period: string | null
          skills: string[] | null
          joining_date: string | null
          employment_history: string | null
          base_salary: number | null
          hourly_rate: number | null
          payment_schedule: string | null
          bank_name: string | null
          bank_account: string | null
          tax_id: string | null
          bonus: number | null
          deductions: number | null
          net_salary: number | null
          working_hours_per_week: number | null
          default_shift: string | null
          weekend_availability: boolean | null
          overtime_eligible: boolean | null
          time_off_accrual_rate: number | null
          annual_leave_balance: number | null
          sick_leave_balance: number | null
          leave_start_date: string | null
          leave_end_date: string | null
          leave_reason: string | null
          last_evaluation_date: string | null
          evaluation_score: number | null
          next_evaluation_date: string | null
          performance_notes: string | null
          performance_score: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          address?: string | null
          role: string
          department: string
          start_date: string
          profile_photo_url?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          is_active?: boolean
          last_login?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          gender?: string | null
          marital_status?: string | null
          blood_group?: string | null
          nationality?: string | null
          employee_id?: string | null
          contract_type?: string | null
          hire_status?: string | null
          probation_end_date?: string | null
          notice_period?: string | null
          skills?: string[] | null
          joining_date?: string | null
          employment_history?: string | null
          base_salary?: number | null
          hourly_rate?: number | null
          payment_schedule?: string | null
          bank_name?: string | null
          bank_account?: string | null
          tax_id?: string | null
          bonus?: number | null
          deductions?: number | null
          net_salary?: number | null
          working_hours_per_week?: number | null
          default_shift?: string | null
          weekend_availability?: boolean | null
          overtime_eligible?: boolean | null
          time_off_accrual_rate?: number | null
          annual_leave_balance?: number | null
          sick_leave_balance?: number | null
          leave_start_date?: string | null
          leave_end_date?: string | null
          leave_reason?: string | null
          last_evaluation_date?: string | null
          evaluation_score?: number | null
          next_evaluation_date?: string | null
          performance_notes?: string | null
          performance_score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          role?: string
          department?: string
          start_date?: string
          profile_photo_url?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          is_active?: boolean
          last_login?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          gender?: string | null
          marital_status?: string | null
          blood_group?: string | null
          nationality?: string | null
          employee_id?: string | null
          contract_type?: string | null
          hire_status?: string | null
          probation_end_date?: string | null
          notice_period?: string | null
          skills?: string[] | null
          joining_date?: string | null
          employment_history?: string | null
          base_salary?: number | null
          hourly_rate?: number | null
          payment_schedule?: string | null
          bank_name?: string | null
          bank_account?: string | null
          tax_id?: string | null
          bonus?: number | null
          deductions?: number | null
          net_salary?: number | null
          working_hours_per_week?: number | null
          default_shift?: string | null
          weekend_availability?: boolean | null
          overtime_eligible?: boolean | null
          time_off_accrual_rate?: number | null
          annual_leave_balance?: number | null
          sick_leave_balance?: number | null
          leave_start_date?: string | null
          leave_end_date?: string | null
          leave_reason?: string | null
          last_evaluation_date?: string | null
          evaluation_score?: number | null
          next_evaluation_date?: string | null
          performance_notes?: string | null
          performance_score?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      staff_documents: {
        Row: {
          id: string
          staff_id: string
          document_type: string
          document_name: string
          document_url: string
          expiry_date: string | null
          is_verified: boolean
          verified_by: string | null
          verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          document_type: string
          document_name: string
          document_url: string
          expiry_date?: string | null
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          document_type?: string
          document_name?: string
          document_url?: string
          expiry_date?: string | null
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          discount: number
          total_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          customer_name: string | null
          customer_phone: string | null
          table_number: string | null
          order_type: string | null
          payment_method: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          discount?: number
          total_amount: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          order_type?: string | null
          payment_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          discount?: number
          total_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          order_type?: string | null
          payment_method?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          name: string
          quantity: number
          price: number
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          name: string
          quantity: number
          price: number
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          name?: string
          quantity?: number
          price?: number
          notes?: string | null
          created_at?: string | null
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image: string
          category: string
          preparation_time: number
          is_available: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image: string
          category: string
          preparation_time: number
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image?: string
          category?: string
          preparation_time?: number
          is_available?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Enums: {
      order_status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
      payment_status: "pending" | "completed" | "failed"
    }
  }
}