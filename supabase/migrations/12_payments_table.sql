-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(255),
    payment_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Add payment related columns to orders table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Row level security policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY payments_select_policy ON public.payments
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY payments_insert_policy ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Only staff or admins can update or delete payments
-- First check if users table exists to avoid errors
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Create policies that depend on users table
        EXECUTE 'CREATE POLICY payments_update_policy ON public.payments
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE users.id = auth.uid() AND (users.role = ''admin'' OR users.role = ''staff'')
                )
            )';

        EXECUTE 'CREATE POLICY payments_delete_policy ON public.payments
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE users.id = auth.uid() AND users.role = ''admin''
                )
            )';
    ELSE
        -- Create simpler policies if users table doesn't exist yet
        EXECUTE 'CREATE POLICY payments_update_policy ON public.payments
            FOR UPDATE
            TO authenticated
            USING (TRUE)';

        EXECUTE 'CREATE POLICY payments_delete_policy ON public.payments
            FOR DELETE
            TO authenticated
            USING (TRUE)';
    END IF;
END $$;

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_timestamp
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();
