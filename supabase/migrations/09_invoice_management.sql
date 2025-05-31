/*
  # 09_invoice_management.sql - Complete Invoice System
  
  This migration creates a comprehensive invoice management system including:
  - Invoice settings table with basic configuration
  - Advanced invoice features and customization options
  - Default invoice templates
  - Update timestamp functionality
  
  Consolidated from: 10_invoice_settings.sql, 11_advanced_invoice_features.sql
  Generated: 2025-05-31
*/

-- Create invoice_settings table with all features
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES profiles(id),
  template_name VARCHAR(50) NOT NULL DEFAULT 'default',
  
  -- Company information
  company_name VARCHAR(100),
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(100),
  company_website VARCHAR(100),
  company_logo_url TEXT,
  
  -- Color scheme
  primary_color VARCHAR(10) DEFAULT '#f97316',
  secondary_color VARCHAR(10) DEFAULT '#ffa500',
  accent_color VARCHAR(10) DEFAULT '#000000',
  
  -- Content customization
  header_text TEXT,
  footer_text TEXT,
  terms_conditions TEXT,
  
  -- Tax configuration
  tax_label_1 VARCHAR(20) DEFAULT 'CGST',
  tax_rate_1 NUMERIC(5,2) DEFAULT 9.00,
  tax_label_2 VARCHAR(20) DEFAULT 'SGST',
  tax_rate_2 NUMERIC(5,2) DEFAULT 9.00,
  include_tax_breakdown BOOLEAN DEFAULT TRUE,
  
  -- Formatting options
  invoice_prefix VARCHAR(10) DEFAULT '',
  invoice_suffix VARCHAR(10) DEFAULT '',
  date_format VARCHAR(20) DEFAULT 'dd MMM yyyy',
  receipt_width INTEGER DEFAULT 80,
  receipt_title VARCHAR(50) DEFAULT 'RECEIPT',
  
  -- Display options
  show_restaurant_contact BOOLEAN DEFAULT TRUE,
  include_qr_code BOOLEAN DEFAULT FALSE,
  qr_code_content TEXT,
  
  -- Advanced features
  watermark_text TEXT,
  watermark_opacity NUMERIC(3,2) DEFAULT 0.1,
  custom_css TEXT,
  custom_header_html TEXT,
  custom_footer_html TEXT,
  include_signature_field BOOLEAN DEFAULT FALSE,
  signature_text TEXT,
  digital_signature_url TEXT,
  font_family VARCHAR(100) DEFAULT 'helvetica',
  custom_fields JSONB DEFAULT '[]'::jsonb,
  item_table_columns JSONB DEFAULT '["Item", "Qty", "Price", "Amount"]'::jsonb,
  page_size VARCHAR(20) DEFAULT 'A4',
  page_orientation VARCHAR(20) DEFAULT 'portrait',
  currency_symbol VARCHAR(10) DEFAULT 'Rs',
  currency_format VARCHAR(20) DEFAULT 'symbol_before',
  enable_auto_numbering BOOLEAN DEFAULT TRUE,
  show_paid_stamp BOOLEAN DEFAULT TRUE, 
  show_overdue_stamp BOOLEAN DEFAULT FALSE,
  itemized_tax_display BOOLEAN DEFAULT FALSE,
  barcode_type VARCHAR(20) DEFAULT 'qr',
  barcode_content TEXT,
  include_payment_instructions BOOLEAN DEFAULT FALSE,
  payment_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER invoice_settings_updated_at
  BEFORE UPDATE ON invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Create default invoice template
INSERT INTO invoice_settings (
  template_name, 
  company_name, 
  company_address, 
  company_email
) VALUES (
  'default', 
  'TastyBites', 
  'Malad west Mumbai Maharashtra', 
  'tastybites@example.com'
) ON CONFLICT DO NOTHING;

-- Create premium template
INSERT INTO invoice_settings (
  template_name,
  company_name,
  company_address,
  company_email,
  primary_color,
  secondary_color,
  accent_color,
  watermark_text,
  include_signature_field,
  show_paid_stamp,
  include_payment_instructions,
  payment_instructions,
  footer_text,
  terms_conditions
) VALUES (
  'premium',
  'TastyBites Premium',
  'Malad west Mumbai Maharashtra',
  'premium@tastybites.com',
  '#3f51b5',
  '#2196f3',
  '#607d8b',
  'CONFIDENTIAL',
  TRUE,
  TRUE,
  TRUE,
  'Payment is due within 30 days. Please make checks payable to TastyBites Premium.',
  'Thank you for your business!',
  'All sales are final. Returns accepted within 7 days with receipt.'
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE invoice_settings IS 'Comprehensive invoice customization and template settings';
COMMENT ON COLUMN invoice_settings.template_name IS 'Template identifier (default, premium, etc.)';
COMMENT ON COLUMN invoice_settings.custom_fields IS 'JSON array of custom fields to include in invoices';
COMMENT ON COLUMN invoice_settings.item_table_columns IS 'JSON array defining invoice line item table columns';
