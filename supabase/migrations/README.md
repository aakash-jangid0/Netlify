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

## Migration History

These consolidated migration files replace the previous set of 55 individual migration files.
The original migrations were backed up to `supabase/migrations_backup/` before consolidation.

## How to Apply Migrations

To apply these migrations:

```bash
# Using Supabase CLI
supabase db reset

# Or manually
psql -f 00_reset_database.sql
psql -f 01_base_schema.sql
psql -f 02_core_tables.sql
psql -f 03_customer_management.sql
psql -f 04_staff_management.sql
psql -f 05_restaurant_management.sql
psql -f 06_financial_management.sql
psql -f 07_indexes_optimization.sql
```

## Benefits of Consolidation

1. Improved maintainability with logical organization
2. Eliminated duplicate and conflicting statements
3. Ensured proper dependency ordering
4. Reduced number of migration files from 55 to 8
5. Added comprehensive documentation

Last updated: May 12, 2025
