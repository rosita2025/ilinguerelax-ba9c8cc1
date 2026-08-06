-- Grant permissions to digital_product_changes to allow the trigger (service_role) to insert
GRANT ALL ON public.digital_product_changes TO service_role;
GRANT SELECT ON public.digital_product_changes TO authenticated;

-- Ensure RLS is enabled and service_role can manage it
ALTER TABLE public.digital_product_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages digital_product_changes" 
ON public.digital_product_changes FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admins can view digital_product_changes" 
ON public.digital_product_changes FOR SELECT 
TO authenticated 
USING (true);
