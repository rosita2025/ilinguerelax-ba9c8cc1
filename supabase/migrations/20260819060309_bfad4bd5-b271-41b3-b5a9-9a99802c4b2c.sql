CREATE TABLE public.physical_shipments (
  order_number TEXT PRIMARY KEY,
  email TEXT,
  customer_name TEXT,
  provider TEXT,
  tracking_number TEXT,
  shipping_provider TEXT,
  shipping_proof_url TEXT,
  shipping_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.physical_shipments TO service_role;

ALTER TABLE public.physical_shipments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_physical_shipments_updated_at
BEFORE UPDATE ON public.physical_shipments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();