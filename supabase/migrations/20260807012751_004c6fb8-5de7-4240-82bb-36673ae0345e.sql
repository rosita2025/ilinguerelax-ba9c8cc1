GRANT ALL ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;
GRANT ALL ON public.product_upsells TO authenticated;
GRANT ALL ON public.product_upsells TO service_role;

DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        DROP POLICY IF EXISTS "Admins can manage products" ON public.digital_products;
        CREATE POLICY "Admins can manage products" ON public.digital_products
            FOR ALL TO authenticated
            USING (public.has_role(auth.uid(), 'admin'))
            WITH CHECK (public.has_role(auth.uid(), 'admin'));
            
        DROP POLICY IF EXISTS "Admins can manage upsells" ON public.product_upsells;
        CREATE POLICY "Admins can manage upsells" ON public.product_upsells
            FOR ALL TO authenticated
            USING (public.has_role(auth.uid(), 'admin'))
            WITH CHECK (public.has_role(auth.uid(), 'admin'));
            
        -- Allow public reads
        DROP POLICY IF EXISTS "Anyone can view products" ON public.digital_products;
        CREATE POLICY "Anyone can view products" ON public.digital_products
            FOR SELECT TO public USING (active = true OR public.has_role(auth.uid(), 'admin'));

        DROP POLICY IF EXISTS "Anyone can view upsells" ON public.product_upsells;
        CREATE POLICY "Anyone can view upsells" ON public.product_upsells
            FOR SELECT TO public USING (true);
    ELSE
        -- Fallback if user_roles system is not yet fully active
        DROP POLICY IF EXISTS "Authenticated can manage products" ON public.digital_products;
        CREATE POLICY "Authenticated can manage products" ON public.digital_products
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
            
        DROP POLICY IF EXISTS "Authenticated can manage upsells" ON public.product_upsells;
        CREATE POLICY "Authenticated can manage upsells" ON public.product_upsells
            FOR ALL TO authenticated USING (true) WITH CHECK (true);

        DROP POLICY IF EXISTS "Public can view products" ON public.digital_products;
        CREATE POLICY "Public can view products" ON public.digital_products
            FOR SELECT TO public USING (true);

        DROP POLICY IF EXISTS "Public can view upsells" ON public.product_upsells;
        CREATE POLICY "Public can view upsells" ON public.product_upsells
            FOR SELECT TO public USING (true);
    END IF;
END
$$;
