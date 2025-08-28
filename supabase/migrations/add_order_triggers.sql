-- Automated Customer Analytics Triggers
-- This ensures customer analytics are ALWAYS updated when orders are created/updated
-- This is a backup system to the application-level automation

-- Function to automatically update customer analytics when orders change
CREATE OR REPLACE FUNCTION update_customer_analytics_on_order()
RETURNS TRIGGER AS $$
DECLARE
    customer_record RECORD;
    order_stats RECORD;
    avg_frequency_days DECIMAL;
    visit_freq TEXT;
    loyalty_tier_val TEXT;
BEGIN
    -- Only proceed if the order has a customer_id
    IF NEW.customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current customer data
    SELECT * INTO customer_record
    FROM customers
    WHERE id = NEW.customer_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Calculate order statistics for this customer
    SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
    INTO order_stats
    FROM orders
    WHERE customer_id = NEW.customer_id
    AND status != 'cancelled';

    -- Calculate average order frequency in days
    IF order_stats.total_orders > 1 THEN
        avg_frequency_days := EXTRACT(EPOCH FROM (order_stats.last_order - order_stats.first_order)) / 86400 / (order_stats.total_orders - 1);
    ELSE
        avg_frequency_days := NULL;
    END IF;

    -- Determine visit frequency
    visit_freq := 'irregular';
    IF avg_frequency_days IS NOT NULL THEN
        IF avg_frequency_days <= 3 THEN
            visit_freq := 'daily';
        ELSIF avg_frequency_days <= 10 THEN
            visit_freq := 'weekly';
        ELSIF avg_frequency_days <= 40 THEN
            visit_freq := 'monthly';
        END IF;
    END IF;

    -- Determine loyalty tier based on total spent
    loyalty_tier_val := 'bronze';
    IF order_stats.total_spent >= 1000 THEN
        loyalty_tier_val := 'platinum';
    ELSIF order_stats.total_spent >= 500 THEN
        loyalty_tier_val := 'gold';
    ELSIF order_stats.total_spent >= 200 THEN
        loyalty_tier_val := 'silver';
    END IF;

    -- Update customer analytics
    UPDATE customers
    SET
        total_orders = order_stats.total_orders,
        total_spent = COALESCE(order_stats.total_spent, 0),
        order_count = order_stats.total_orders,
        average_order_value = COALESCE(order_stats.avg_order_value, 0),
        last_visit = NOW(),
        last_order_date = order_stats.last_order,
        first_order_date = COALESCE(customer_record.first_order_date, order_stats.first_order),
        loyalty_points = FLOOR(COALESCE(order_stats.total_spent, 0)),
        loyalty_tier = loyalty_tier_val,
        visit_frequency = visit_freq,
        avg_order_frequency_days = avg_frequency_days,
        updated_at = NOW()
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_update_customer_analytics_on_insert ON orders;
CREATE TRIGGER trigger_update_customer_analytics_on_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_analytics_on_order();

-- Create trigger for order updates (in case total_amount changes)
DROP TRIGGER IF EXISTS trigger_update_customer_analytics_on_update ON orders;
CREATE TRIGGER trigger_update_customer_analytics_on_update
    AFTER UPDATE OF total_amount, status ON orders
    FOR EACH ROW
    WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_customer_analytics_on_order();

-- Function to automatically update customer preferences when order items are added
CREATE OR REPLACE FUNCTION update_customer_preferences_on_order_items()
RETURNS TRIGGER AS $$
DECLARE
    order_customer_id UUID;
    item_category TEXT;
    cuisine_type TEXT;
BEGIN
    -- Get customer_id from the order
    SELECT customer_id INTO order_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    -- Only proceed if order has a customer_id
    IF order_customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Simple cuisine detection based on item name
    cuisine_type := 'other';
    IF LOWER(NEW.name) SIMILAR TO '%pizza%|%pasta%|%lasagna%' THEN
        cuisine_type := 'italian';
    ELSIF LOWER(NEW.name) SIMILAR TO '%burger%|%fries%|%sandwich%' THEN
        cuisine_type := 'american';
    ELSIF LOWER(NEW.name) SIMILAR TO '%curry%|%biryani%|%naan%|%dal%' THEN
        cuisine_type := 'indian';
    ELSIF LOWER(NEW.name) SIMILAR TO '%sushi%|%ramen%|%tempura%' THEN
        cuisine_type := 'japanese';
    ELSIF LOWER(NEW.name) SIMILAR TO '%taco%|%burrito%|%quesadilla%' THEN
        cuisine_type := 'mexican';
    END IF;

    -- Update customer's preferred cuisine (simple frequency-based approach)
    UPDATE customers
    SET
        preferred_cuisine = cuisine_type,
        updated_at = NOW()
    WHERE id = order_customer_id
    AND (preferred_cuisine IS NULL OR preferred_cuisine = 'other');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order items to update preferences
DROP TRIGGER IF EXISTS trigger_update_customer_preferences ON order_items;
CREATE TRIGGER trigger_update_customer_preferences
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_preferences_on_order_items();

-- Create a function to handle customer sync when users sign up
CREATE OR REPLACE FUNCTION sync_user_to_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Create customer record for new auth users
    INSERT INTO customers (
        user_id,
        name,
        email,
        customer_source,
        referral_code,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'website',
        'REF' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(customers.name, EXCLUDED.name),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auth.users to auto-create customer records
DROP TRIGGER IF EXISTS trigger_sync_user_to_customer ON auth.users;
CREATE TRIGGER trigger_sync_user_to_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_customer();

-- Create indexes for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_analytics ON customers(loyalty_tier, total_spent, total_orders);

COMMENT ON FUNCTION update_customer_analytics_on_order() IS 
'Automatically updates customer analytics (total orders, spend, loyalty tier, etc.) whenever orders are created or modified';

COMMENT ON FUNCTION update_customer_preferences_on_order_items() IS 
'Automatically detects and updates customer cuisine preferences based on order items';

COMMENT ON FUNCTION sync_user_to_customer() IS 
'Automatically creates customer records when users register via auth.users';
