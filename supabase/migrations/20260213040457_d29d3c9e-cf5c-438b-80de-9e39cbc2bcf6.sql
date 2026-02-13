
-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT NOT NULL DEFAULT 'english',
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews (public for SEO)
CREATE POLICY "Anyone can read approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

-- Anyone can submit a review (no auth needed for customers)
CREATE POLICY "Anyone can submit a review"
ON public.reviews
FOR INSERT
WITH CHECK (status = 'pending');

-- Create index for performance
CREATE INDEX idx_reviews_product_status ON public.reviews (product_type, status);
CREATE INDEX idx_reviews_created_at ON public.reviews (created_at DESC);

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true);

-- Storage policies for review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "Anyone can upload review photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'review-photos');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();
