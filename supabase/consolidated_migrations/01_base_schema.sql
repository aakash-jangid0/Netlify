/*
  # Base Schema Migration
  
  Sets up extensions, custom types, and common utility functions
  
  Generated: 2025-05-12T12:10:13.917Z
*/

-- Other statements

-- From: 20250319075726_ancient_sea.sql
CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

-- From: 20250427115045_silver_lake.sql
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');

