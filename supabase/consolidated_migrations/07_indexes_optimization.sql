/*
  # Indexes and Optimization Migration
  
  Creates indexes and optimization functions
  
  Generated: 2025-05-12T12:10:13.939Z
*/

-- Other statements

-- From: 20240514000000_fix_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON public.staff_documents(staff_id);

-- From: 20240514000000_fix_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_staff_id ON public.staff_performance_reviews(staff_id);

-- From: 20250427115045_silver_lake.sql
CREATE INDEX orders_status_idx ON orders(status);

-- From: 20250427115045_silver_lake.sql
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- From: 20250427115045_silver_lake.sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- From: 20250427121855_broken_fire.sql
CREATE TRIGGER validate_order_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order();

-- From: 20250427160434_bold_sky.sql
CREATE INDEX invoices_invoice_number_idx ON invoices(invoice_number);

-- From: 20250427160434_bold_sky.sql
CREATE INDEX invoices_customer_phone_idx ON invoices(customer_phone);

-- From: 20250427160434_bold_sky.sql
CREATE INDEX invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- From: 20250428011710_hidden_morning.sql
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

-- From: 20250428011710_hidden_morning.sql
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(payment_status);

-- From: 20250503083933_solitary_glade.sql
CREATE INDEX inventory_status_idx ON inventory(status);

-- From: 20250503083933_solitary_glade.sql
CREATE INDEX inventory_supplier_idx ON inventory(supplier);

-- From: 20250503083933_solitary_glade.sql
CREATE INDEX inventory_expiry_date_idx ON inventory(expiry_date);

-- From: 20250503083933_solitary_glade.sql
CREATE INDEX inventory_transactions_type_idx ON inventory_transactions(transaction_type);

-- From: 20250503083933_solitary_glade.sql
CREATE INDEX inventory_transactions_created_at_idx ON inventory_transactions(created_at);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_role_idx ON staff(role);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_department_idx ON staff(department);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_activity_logs_staff_id_idx ON staff_activity_logs(staff_id);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_activity_logs_created_at_idx ON staff_activity_logs(created_at);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_attendance_staff_id_idx ON staff_attendance(staff_id);

-- From: 20250505122407_rough_salad.sql
CREATE INDEX staff_attendance_check_in_idx ON staff_attendance(check_in);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_shifts_date_idx ON staff_shifts(start_time);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_performance_staff_id_idx ON staff_performance(staff_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_training_staff_id_idx ON staff_training(staff_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_payroll_staff_id_idx ON staff_payroll(staff_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_leave_staff_id_idx ON staff_leave(staff_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_leave_status_idx ON staff_leave(status);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_documents_staff_id_idx ON staff_documents(staff_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_communications_sender_id_idx ON staff_communications(sender_id);

-- From: 20250506081741_twilight_wind.sql
CREATE INDEX staff_communications_recipient_id_idx ON staff_communications(recipient_id);

-- From: 20250509120000_create_menu_items_table.sql
CREATE TRIGGER tr_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE PROCEDURE update_menu_items_updated_at();

-- From: 20250509_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_documents_category ON public.staff_documents("category");

-- From: 20250509_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_documents_status ON public.staff_documents(status);

-- From: 20250509_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_reviewer_id ON public.staff_performance_reviews(reviewer_id);

-- From: 20250509_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_rating ON public.staff_performance_reviews(rating);

-- From: 20250510112345_database_optimization.sql
CREATE TRIGGER validate_order_trigger
      BEFORE INSERT OR UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION validate_order();

-- From: 20250510112345_database_optimization.sql
CREATE TRIGGER update_inventory_status_trigger
      BEFORE INSERT OR UPDATE OF quantity ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_inventory_status();

-- From: 20250510112345_database_optimization.sql
CREATE TRIGGER on_order_update_taste_profile
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_taste_profile();

-- From: 20250510200000_setup_attendance_shifts.sql
CREATE INDEX idx_staff_attendance_check_in ON public.staff_attendance(check_in);

-- From: 20250510200000_setup_attendance_shifts.sql
CREATE INDEX idx_staff_attendance_status ON public.staff_attendance(status);

-- From: 20250510200000_setup_attendance_shifts.sql
CREATE INDEX idx_staff_shifts_start_time ON public.staff_shifts(start_time);

-- From: 20250510200000_setup_attendance_shifts.sql
CREATE INDEX idx_staff_shifts_shift_type ON public.staff_shifts(shift_type);

-- From: 20250510_create_categories_table.sql
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- From: 20250510_fix_staff_tables.sql
CREATE TRIGGER set_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- From: 20250511000000_setup_attendance_system.sql
CREATE INDEX idx_staff_attendance_date ON public.staff_attendance(date);

-- From: 20250511000001_setup_shift_scheduler.sql
CREATE INDEX idx_staff_shifts_shift_date ON public.staff_shifts(shift_date);

-- From: 20250514000000_fix_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_documents_document_type ON public.staff_documents(document_type);

-- From: 20250514000000_fix_staff_documents_performance.sql
CREATE INDEX IF NOT EXISTS idx_staff_performance_reviews_review_date ON public.staff_performance_reviews(review_date);

-- From: 20250515000000_create_feedback_system.sql
CREATE TRIGGER tr_feedback_updated_at
BEFORE UPDATE ON order_feedback
FOR EACH ROW
EXECUTE PROCEDURE update_feedback_updated_at();

-- From: 20250515000000_create_feedback_system.sql
CREATE INDEX idx_order_feedback_user_id ON order_feedback(user_id);

-- From: 20250515000000_create_feedback_system.sql
CREATE INDEX idx_order_feedback_created_at ON order_feedback(created_at);

-- From: 20250515000000_create_feedback_system.sql
CREATE INDEX idx_order_feedback_overall_rating ON order_feedback(overall_rating);

