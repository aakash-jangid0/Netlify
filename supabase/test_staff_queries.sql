-- Test SQL script to verify staff management functionality

-- Check if staff table exists and has all fields
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'staff'
);

-- Check columns in the staff table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'staff'
ORDER BY ordinal_position;

-- Check if staff have been inserted
SELECT id, full_name, email, role, department, is_active
FROM staff
LIMIT 10;

-- Check staff documents
SELECT sd.id, sd.document_name, sd.document_type, s.full_name
FROM staff_documents sd
JOIN staff s ON sd.staff_id = s.id
LIMIT 10;

-- Test query for staff management dashboard
SELECT 
  s.id,
  s.full_name,
  s.email,
  s.phone,
  s.role,
  s.department,
  s.is_active,
  s.start_date,
  s.profile_photo_url,
  COUNT(sd.id) AS document_count
FROM staff s
LEFT JOIN staff_documents sd ON s.id = sd.staff_id
GROUP BY s.id, s.full_name, s.email, s.phone, s.role, s.department, s.is_active, s.start_date, s.profile_photo_url
ORDER BY s.created_at DESC;

-- Test query for staff performance dashboard
SELECT 
  s.id,
  s.full_name,
  s.role,
  s.department,
  s.performance_score,
  s.last_evaluation_date,
  s.next_evaluation_date
FROM staff s
WHERE s.is_active = true
ORDER BY s.performance_score DESC;

-- Filter staff by role example
SELECT 
  s.id,
  s.full_name,
  s.email,
  s.role,
  s.department,
  s.is_active
FROM staff s
WHERE s.role = 'chef'
ORDER BY s.full_name;

-- Filter staff by department example
SELECT 
  s.id,
  s.full_name,
  s.email,
  s.role,
  s.department,
  s.is_active
FROM staff s
WHERE s.department = 'kitchen'
ORDER BY s.full_name;

-- Search staff by name or email example
SELECT 
  s.id,
  s.full_name,
  s.email,
  s.role,
  s.department,
  s.is_active
FROM staff s
WHERE 
  s.full_name ILIKE '%john%' OR
  s.email ILIKE '%john%'
ORDER BY s.full_name;
