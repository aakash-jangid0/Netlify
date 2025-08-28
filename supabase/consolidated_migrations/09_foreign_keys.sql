-- Foreign Key Constraints
-- All table relationships and foreign keys
-- Date: 2025-08-24

-- Customer relationships
ALTER TABLE customer_activities ADD CONSTRAINT customer_activities_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);

-- User relationships
ALTER TABLE favorite_items ADD CONSTRAINT favorite_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE user_demographics ADD CONSTRAINT user_demographics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES user_visits(id);
ALTER TABLE user_interactions ADD CONSTRAINT user_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE user_visits ADD CONSTRAINT user_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Profile relationships
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

-- Inventory relationships
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES inventory(id);
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Invoice relationships
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

-- Order relationships
ALTER TABLE order_feedback ADD CONSTRAINT order_feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_feedback ADD CONSTRAINT order_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE orders ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons(id);

-- Payment relationships
ALTER TABLE payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);

-- Staff relationships
ALTER TABLE staff ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE staff_activity_logs ADD CONSTRAINT staff_activity_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_attendance ADD CONSTRAINT staff_attendance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_communications ADD CONSTRAINT staff_communications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES staff(id);
ALTER TABLE staff_communications ADD CONSTRAINT staff_communications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES staff(id);
ALTER TABLE staff_documents ADD CONSTRAINT staff_documents_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_documents ADD CONSTRAINT staff_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES staff(id);
ALTER TABLE staff_leave ADD CONSTRAINT staff_leave_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_leave ADD CONSTRAINT staff_leave_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES staff(id);
ALTER TABLE staff_payroll ADD CONSTRAINT staff_payroll_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_performance ADD CONSTRAINT staff_performance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_performance ADD CONSTRAINT staff_performance_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES staff(id);
ALTER TABLE staff_performance_reviews ADD CONSTRAINT staff_performance_reviews_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_performance_reviews ADD CONSTRAINT staff_performance_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES staff(id);
ALTER TABLE staff_shifts ADD CONSTRAINT staff_shifts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE staff_training ADD CONSTRAINT staff_training_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);

-- Support relationships
ALTER TABLE support_chats ADD CONSTRAINT support_chats_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE support_chats ADD CONSTRAINT support_chats_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE support_chats ADD CONSTRAINT support_chats_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES staff(id);

-- Table relationships
ALTER TABLE tables ADD CONSTRAINT tables_current_order_id_fkey FOREIGN KEY (current_order_id) REFERENCES orders(id);
