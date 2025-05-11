/*
  # Remove Automatic Invoice Generation
  
  1. Changes:
    - Remove the automatic invoice creation trigger from orders table
    - Invoices will now be explicitly created by the client code
    
  2. Reasoning:
    - Allow more control over when invoices are generated 
    - Support manual invoice generation only from invoiceGenerator.ts
*/

-- Drop the automatic invoice creation trigger
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;

-- Keep the invoice function for later reference, but don't automatically trigger it
-- The function will be called explicitly from the client code
DROP FUNCTION IF EXISTS create_invoice_from_order;
