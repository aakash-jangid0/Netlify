-- Database Information Analysis Migration (Single Result Set)
-- This script provides comprehensive database structure information in one combined result
-- Run this to get complete details about tables, columns, keys, indexes, and more

WITH database_info AS (
    -- 1. DATABASE OVERVIEW
    SELECT 
        'DATABASE_OVERVIEW' as info_type,
        'database_name' as attribute,
        current_database() as value,
        1 as sort_order,
        1 as sub_order
    UNION ALL
    SELECT 
        'DATABASE_OVERVIEW' as info_type,
        'current_user' as attribute,
        current_user as value,
        1 as sort_order,
        2 as sub_order
    UNION ALL
    SELECT 
        'DATABASE_OVERVIEW' as info_type,
        'postgresql_version' as attribute,
        version() as value,
        1 as sort_order,
        3 as sub_order
    UNION ALL
    SELECT 
        'DATABASE_OVERVIEW' as info_type,
        'analysis_timestamp' as attribute,
        current_timestamp::text as value,
        1 as sort_order,
        4 as sub_order
        
    UNION ALL
    
    -- 2. GET ALL SCHEMAS
    SELECT 
        'SCHEMAS' as info_type,
        schema_name as attribute,
        schema_owner as value,
        2 as sort_order,
        ROW_NUMBER() OVER (ORDER BY schema_name) as sub_order
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 3. GET ALL TABLES WITH DETAILED INFORMATION
    SELECT 
        'TABLES' as info_type,
        t.table_schema || '.' || t.table_name as attribute,
        COALESCE(
            'type=' || t.table_type || 
            ', size=' || COALESCE(pg_size_pretty(pg_total_relation_size(c.oid)), 'unknown') ||
            ', indexes=' || COALESCE(pt.hasindexes::text, 'false') ||
            ', triggers=' || COALESCE(pt.hastriggers::text, 'false') ||
            ', rls=' || COALESCE(pt.rowsecurity::text, 'false'),
            'Basic table info'
        ) as value,
        3 as sort_order,
        ROW_NUMBER() OVER (ORDER BY t.table_schema, t.table_name) as sub_order
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = t.table_schema
    WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 4. GET ALL COLUMNS WITH DETAILED INFORMATION
    SELECT 
        'COLUMNS' as info_type,
        c.table_schema || '.' || c.table_name || '.' || c.column_name as attribute,
        'position=' || c.ordinal_position::text ||
        ', type=' || c.data_type ||
        CASE WHEN c.character_maximum_length IS NOT NULL 
             THEN '(' || c.character_maximum_length::text || ')' 
             ELSE '' END ||
        ', nullable=' || c.is_nullable ||
        ', default=' || COALESCE(c.column_default, 'none') ||
        ', pk=' || CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END ||
        ', fk=' || CASE WHEN fk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END ||
        CASE WHEN fk.column_name IS NOT NULL 
             THEN ' -> ' || fk.foreign_table_schema || '.' || fk.foreign_table_name || '.' || fk.foreign_column_name
             ELSE '' END as value,
        4 as sort_order,
        ROW_NUMBER() OVER (ORDER BY c.table_schema, c.table_name, c.ordinal_position) as sub_order
    FROM information_schema.columns c
    LEFT JOIN (
        SELECT 
            kcu.table_schema,
            kcu.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.table_schema = pk.table_schema 
        AND c.table_name = pk.table_name 
        AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT 
            kcu.table_schema,
            kcu.table_name,
            kcu.column_name,
            ccu.table_schema as foreign_table_schema,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.table_schema = fk.table_schema 
        AND c.table_name = fk.table_name 
        AND c.column_name = fk.column_name
    WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 5. GET ALL PRIMARY KEYS
    SELECT 
        'PRIMARY_KEYS' as info_type,
        tc.table_schema || '.' || tc.table_name as attribute,
        tc.constraint_name || ' (' || string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || ')' as value,
        5 as sort_order,
        ROW_NUMBER() OVER (ORDER BY tc.table_schema, tc.table_name) as sub_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
    
    UNION ALL
    
    -- 6. GET ALL FOREIGN KEYS
    SELECT 
        'FOREIGN_KEYS' as info_type,
        tc.table_schema || '.' || tc.table_name || '.' || kcu.column_name as attribute,
        tc.constraint_name || ' -> ' || ccu.table_schema || '.' || ccu.table_name || '.' || ccu.column_name ||
        ' (update=' || rc.update_rule || ', delete=' || rc.delete_rule || ')' as value,
        6 as sort_order,
        ROW_NUMBER() OVER (ORDER BY tc.table_schema, tc.table_name, kcu.column_name) as sub_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 7. GET ALL UNIQUE CONSTRAINTS
    SELECT 
        'UNIQUE_CONSTRAINTS' as info_type,
        tc.table_schema || '.' || tc.table_name as attribute,
        tc.constraint_name || ' (' || string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || ')' as value,
        7 as sort_order,
        ROW_NUMBER() OVER (ORDER BY tc.table_schema, tc.table_name) as sub_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
    
    UNION ALL
    
    -- 8. GET ALL CHECK CONSTRAINTS
    SELECT 
        'CHECK_CONSTRAINTS' as info_type,
        tc.table_schema || '.' || tc.table_name as attribute,
        tc.constraint_name || ': ' || cc.check_clause as value,
        8 as sort_order,
        ROW_NUMBER() OVER (ORDER BY tc.table_schema, tc.table_name) as sub_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 9. GET ALL INDEXES
    SELECT 
        'INDEXES' as info_type,
        schemaname || '.' || tablename || '.' || indexname as attribute,
        indexdef as value,
        9 as sort_order,
        ROW_NUMBER() OVER (ORDER BY schemaname, tablename, indexname) as sub_order
    FROM pg_indexes
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 10. GET ALL VIEWS
    SELECT 
        'VIEWS' as info_type,
        table_schema || '.' || table_name as attribute,
        'updatable=' || is_updatable || ', insertable=' || is_insertable_into as value,
        10 as sort_order,
        ROW_NUMBER() OVER (ORDER BY table_schema, table_name) as sub_order
    FROM information_schema.views
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 11. GET ALL FUNCTIONS
    SELECT 
        'FUNCTIONS' as info_type,
        routine_schema || '.' || routine_name as attribute,
        routine_type || ' returns ' || data_type as value,
        11 as sort_order,
        ROW_NUMBER() OVER (ORDER BY routine_schema, routine_name) as sub_order
    FROM information_schema.routines
    WHERE routine_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 12. GET ALL TRIGGERS
    SELECT 
        'TRIGGERS' as info_type,
        trigger_schema || '.' || event_object_table || '.' || trigger_name as attribute,
        event_manipulation || ' ' || action_timing as value,
        12 as sort_order,
        ROW_NUMBER() OVER (ORDER BY trigger_schema, event_object_table, trigger_name) as sub_order
    FROM information_schema.triggers
    WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 13. GET ALL SEQUENCES
    SELECT 
        'SEQUENCES' as info_type,
        sequence_schema || '.' || sequence_name as attribute,
        'type=' || data_type || ', start=' || start_value::text || ', increment=' || increment::text as value,
        13 as sort_order,
        ROW_NUMBER() OVER (ORDER BY sequence_schema, sequence_name) as sub_order
    FROM information_schema.sequences
    WHERE sequence_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 14. GET ROW LEVEL SECURITY POLICIES
    SELECT 
        'RLS_POLICIES' as info_type,
        schemaname || '.' || tablename || '.' || policyname as attribute,
        'permissive=' || permissive || ', roles=' || COALESCE(array_to_string(roles, ','), 'all') || ', cmd=' || cmd as value,
        14 as sort_order,
        ROW_NUMBER() OVER (ORDER BY schemaname, tablename, policyname) as sub_order
    FROM pg_policies
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 15. GET TABLE SIZES
    SELECT 
        'TABLE_SIZES' as info_type,
        pt.schemaname || '.' || pt.tablename as attribute,
        'total=' || pg_size_pretty(pg_total_relation_size(quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename))) ||
        ', table=' || pg_size_pretty(pg_relation_size(quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename))) ||
        ', indexes=' || pg_size_pretty(pg_total_relation_size(quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename)) - pg_relation_size(quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename))) as value,
        15 as sort_order,
        ROW_NUMBER() OVER (ORDER BY pg_total_relation_size(quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename)) DESC) as sub_order
    FROM pg_tables pt
    WHERE pt.schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    
    UNION ALL
    
    -- 16. GET TABLE STATISTICS
    SELECT 
        'TABLE_STATISTICS' as info_type,
        st.schemaname || '.' || st.relname as attribute,
        'inserts=' || st.n_tup_ins::text || ', updates=' || st.n_tup_upd::text || ', deletes=' || st.n_tup_del::text ||
        ', live=' || st.n_live_tup::text || ', dead=' || st.n_dead_tup::text as value,
        16 as sort_order,
        ROW_NUMBER() OVER (ORDER BY st.schemaname, st.relname) as sub_order
    FROM pg_stat_user_tables st
)

SELECT 
    info_type,
    attribute,
    value,
    sort_order,
    sub_order
FROM database_info
ORDER BY sort_order, sub_order;
