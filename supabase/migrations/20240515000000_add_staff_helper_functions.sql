-- Stored procedure to get staff documents
CREATE OR REPLACE FUNCTION get_staff_documents(staff_id_param UUID)
RETURNS SETOF staff_documents AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM staff_documents 
  WHERE staff_id = staff_id_param
  ORDER BY upload_date DESC;
EXCEPTION 
  WHEN undefined_table THEN
    RAISE NOTICE 'staff_documents table does not exist';
    RETURN;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching staff documents: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored procedure to get staff performance reviews
CREATE OR REPLACE FUNCTION get_staff_performance_reviews(staff_id_param UUID)
RETURNS TABLE(
  id UUID,
  staff_id UUID,
  review_date TIMESTAMPTZ,
  rating TEXT,
  goals_achieved TEXT[],
  areas_of_improvement TEXT[],
  comments TEXT,
  next_review_date TIMESTAMPTZ,
  reviewer_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  reviewer_name TEXT
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    r.id,
    r.staff_id,
    r.review_date,
    r.rating,
    r.goals_achieved,
    r.areas_of_improvement,
    r.comments,
    r.next_review_date,
    r.reviewer_id,
    r.created_at,
    r.updated_at,
    s.full_name as reviewer_name
  FROM 
    staff_performance_reviews r
  LEFT JOIN
    staff s ON r.reviewer_id = s.id
  WHERE 
    r.staff_id = staff_id_param
  ORDER BY 
    r.review_date DESC;
EXCEPTION 
  WHEN undefined_table THEN
    RAISE NOTICE 'staff_performance_reviews table does not exist';
    RETURN;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching staff performance reviews: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
