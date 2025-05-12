/*
  # 01_base_schema.sql - Base Schema Migration
  
  Sets up extensions, custom types, and common utility functions required for the restaurant management system.
  
  This migration handles:
  - PostgreSQL extensions
  - Custom ENUM types
  - Common utility functions
  
  Generated: 2025-05-12
*/

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom ENUM types
CREATE TYPE order_status AS ENUM (
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);

CREATE TYPE order_type AS ENUM (
  'dine_in',
  'takeaway',
  'delivery'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'upi',
  'wallet',
  'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

CREATE TYPE staff_role AS ENUM (
  'manager',
  'chef',
  'waiter',
  'cashier',
  'delivery',
  'cleaner'
);

CREATE TYPE shift_type AS ENUM (
  'morning',
  'afternoon',
  'evening',
  'night'
);

-- Create common utility functions

-- Function to update timestamps on row modification
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a random order ID with prefix
CREATE OR REPLACE FUNCTION generate_order_id() 
RETURNS TEXT AS $$
DECLARE
  random_id TEXT;
BEGIN
  SELECT CONCAT('ORD-', LPAD(FLOOR(random() * 100000)::TEXT, 6, '0')) INTO random_id;
  RETURN random_id;
END;
$$ LANGUAGE plpgsql;
