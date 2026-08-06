-- Grant SELECT and manage privileges to authenticated and service_role for digital_products
GRANT SELECT ON public.digital_products TO authenticated;
GRANT ALL ON public.digital_products TO service_role;

-- Grant SELECT and manage privileges to authenticated and service_role for product_upsells
GRANT SELECT ON public.product_upsells TO authenticated;
GRANT ALL ON public.product_upsells TO service_role;

-- Grant SELECT to anon for public visibility (if needed by the app's public routes)
GRANT SELECT ON public.digital_products TO anon;
GRANT SELECT ON public.product_upsells TO anon;

-- Ensure RLS doesn't block authenticated users if they are meant to see them (though manage-products uses service_role)
-- The error "new row violates row level security policy" usually happens during INSERT/UPDATE
-- Since manage-products uses service_role, it should bypass RLS.
-- However, if the client is calling supabase.from(...).insert(...) directly, it would fail.
-- Let's check if the AdminProductEdit.tsx or manage-products function is doing something weird.
