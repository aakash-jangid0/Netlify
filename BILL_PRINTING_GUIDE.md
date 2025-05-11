# Bill Printing Guide

This document explains how bill/invoice printing works in the TastyBites restaurant digitalization platform.

## Overview

The system generates and stores invoices for all orders, but controls when and where they are printed or displayed to users:

- **Main Website (Customer View)**: Bills are generated and stored in the database but not automatically printed or displayed after order creation
- **Order Tracking Page**: Customers can view and download their bill from the order tracking page
- **Admin/Counter Dashboard**: Staff can view, print, and download bills as needed

## Implementation Details

### Main Website Flow

1. When a customer places an order on the main website, an invoice is generated and stored in the database
2. The customer is redirected to the order tracking page
3. No automatic printing or displaying of the bill occurs after order creation

### Viewing Bills

Customers can access their bills through:

- **Order Tracking Page**: By clicking "View Bill" or "Download Bill" buttons
- **Order History**: In their account section (if authenticated)

Staff can access bills through:

- **Order Management**: Admin dashboard with print and download capabilities
- **Counter Dashboard**: For printing receipts for in-person customers

## Technical Implementation

The bill generation uses these key utilities:

- `orderInvoiceUtils.ts`: Handles consistent invoice creation logic
- `invoiceGenerator.ts`: Creates PDF invoices with proper formatting
- `invoiceUtils.ts`: Provides functions for viewing and downloading invoices

## Configuration

The auto-printing behavior can be controlled by:

- Admin users
- Role-based permissions
- Interface type (admin vs customer)

For any further changes to bill printing behavior, modify the main Cart.tsx workflow or the appropriate utility functions.
