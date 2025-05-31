# Database Migration Files

## Migration Structure

The database migrations have been consolidated and organized into logical files:

1. **00_reset_database.sql** - Resets the database to a clean state before applying migrations
2. **01_base_schema.sql** - Base schema including extensions, types, and utility functions
3. **02_core_tables.sql** - Core tables (profiles, orders, order_items)
4. **03_customer_management.sql** - Customer-related tables and functions
5. **04_staff_management.sql** - Staff-related tables and functions
6. **05_restaurant_management.sql** - Restaurant operational tables
7. **06_financial_management.sql** - Financial tables and functions
8. **07_indexes_optimization.sql** - Indexes and optimization functions
9. **08_coupon_management.sql** - Complete coupon system (tables, functions, constraints)
10. **09_invoice_management.sql** - Complete invoice management system with advanced features
11. **10_website_settings.sql** - Comprehensive website customization and settings
12. **11_order_id_format.sql** - Order ID formatting and standardization
13. **12_payments_table.sql** - Payment processing tables and RLS policies
14. **13_supabase_rls_setup.sql** - Row Level Security setup for customer data

## Recent Consolidation (May 31, 2025)

### Files Consolidated:
- **Coupon Management**: Merged files 08, 09, 14 → `08_coupon_management.sql`
  - `08_restore_coupon_columns.sql` (coupon columns for orders)
  - `09_increment_coupon_usage_function.sql` (usage tracking function)
  - `14_coupons_table.sql` (coupons table creation)

- **Invoice Management**: Merged files 10, 11 → `09_invoice_management.sql`
  - `10_invoice_settings.sql` (basic invoice settings)
  - `11_advanced_invoice_features.sql` (advanced customization features)

- **Website Settings**: Merged files 12, 13, 17 → `10_website_settings.sql`
  - `12_website_settings.sql` (website settings with business_id)
  - `13_website_settings_alt.sql` (alternative website settings)
  - `17_website_settings_from_database.sql` (duplicate of file 13)

### Benefits of Consolidation:
- Reduced migration files from 19 to 14 files
- Eliminated duplicate and redundant SQL statements
- Improved logical organization by functionality
- Easier maintenance and debugging
- Consistent naming convention (00-13)

## Migration History

These consolidated migration files replace the previous set of 55 individual migration files.
The original migrations were backed up to `supabase/migrations_backup/` before consolidation.

**May 31, 2025 Updates:** 
- **File Organization**: Moved all database files from `/database/` folder to `/supabase/migrations/`
- **File Consolidation**: Merged similar migration files to reduce redundancy
- **Naming Standardization**: Applied consistent 2-digit numbering scheme (00-13)
- **Removed Duplicates**: Eliminated redundant migration files
- **Central Location**: All database-related SQL files are now in `/supabase/migrations/`

## How to Apply Migrations

To apply these migrations in sequence:

```bash
# Using Supabase CLI
supabase db reset

# Or manually in order
psql -f 00_reset_database.sql
psql -f 01_base_schema.sql
psql -f 02_core_tables.sql
psql -f 03_customer_management.sql
psql -f 04_staff_management.sql
psql -f 05_restaurant_management.sql
psql -f 06_financial_management.sql
psql -f 07_indexes_optimization.sql
psql -f 08_coupon_management.sql
psql -f 09_invoice_management.sql
psql -f 10_website_settings.sql
psql -f 11_order_id_format.sql
psql -f 12_payments_table.sql
psql -f 13_supabase_rls_setup.sql
```

## Benefits of Consolidation

1. **Improved Organization**: Logical grouping by functionality (coupons, invoices, website settings)
2. **Eliminated Redundancy**: Removed duplicate and conflicting SQL statements
3. **Consistent Naming**: All files follow 2-digit numbering scheme (00-13)
4. **Reduced Complexity**: From 19 migration files down to 14 well-organized files
5. **Better Maintainability**: Easier to understand, debug, and modify
6. **Dependency Management**: Proper ordering ensures dependencies are met
7. **Comprehensive Documentation**: Each consolidated file includes detailed comments

**File Reduction Summary:**
- Original: 19 migration files (00-18)
- Consolidated: 14 migration files (00-13)
- Reduction: 26% fewer files with better organization

Last updated: May 31, 2025
