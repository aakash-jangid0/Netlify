-- Function to check database health
-- This will help diagnose connection issues and timeouts

-- First create a function that returns basic health information
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_stats jsonb;
  active_connections integer;
  transaction_count integer;
BEGIN
  -- Get connection count
  SELECT count(*) INTO active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Get transaction count
  SELECT count(*) INTO transaction_count
  FROM pg_stat_activity
  WHERE xact_start IS NOT NULL;
  
  -- Compile stats
  db_stats := jsonb_build_object(
    'success', true,
    'timestamp', extract(epoch from now()),
    'health', 'good',
    'active_connections', active_connections,
    'transactions', transaction_count,
    'version', version()
  );
  
  RETURN db_stats;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'timestamp', extract(epoch from now()),
    'health', 'error',
    'error', SQLERRM
  );
END;
$$;

-- Allow public access to the health check function
GRANT EXECUTE ON FUNCTION check_database_health() TO anon, authenticated, service_role;
