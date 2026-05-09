import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  product_type: string;
  customer_name: string;
  rating: number;
  review_text: string;
  photo_urls: string[];
  status: string;
  created_at: string;
}

export const useReviews = (productType: string) => {
  return useQuery({
    queryKey: ["reviews", productType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews_public" as any)
        .select("*")
        .eq("product_type", productType)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Review[];
    },
  });
};

export const useAllReviews = () => {
  return useQuery({
    queryKey: ["reviews", "all-admin"],
    queryFn: async () => {
      // This will only return approved reviews due to RLS
      // Admin page will use edge function to get all
      const { data, error } = await supabase
        .from("reviews_public" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Review[];
    },
  });
};
