-- Database Views
-- Views for analytics and reporting
-- Date: 2025-08-24

-- Active customers view - customers who have placed orders in the last 90 days
CREATE OR REPLACE VIEW active_customers_view AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.created_at,
  c.last_visit,
  c.total_orders,
  c.total_spent
FROM customers c
WHERE c.last_visit >= (CURRENT_DATE - INTERVAL '90 days');

-- Order insights view - comprehensive order analytics
CREATE OR REPLACE VIEW order_insights AS
SELECT 
  o.id,
  o.status,
  o.payment_status,
  o.created_at,
  o.table_number,
  o.customer_name,
  o.customer_phone,
  o.total_amount,
  o.subtotal,
  o.tax,
  o.discount,
  o.payment_method,
  o.order_type,
  o.estimated_completion_time,
  o.actual_completion_time,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.payment_status, o.created_at, o.table_number, 
         o.customer_name, o.customer_phone, o.total_amount, o.subtotal, 
         o.tax, o.discount, o.payment_method, o.order_type, 
         o.estimated_completion_time, o.actual_completion_time;

-- Top customers view - customers ranked by total spending
CREATE OR REPLACE VIEW top_customers_view AS
SELECT 
  id,
  name,
  email,
  phone,
  total_orders,
  total_spent
FROM customers
ORDER BY total_spent DESC;
