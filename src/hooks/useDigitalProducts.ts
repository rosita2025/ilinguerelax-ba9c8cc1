import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

interface DBProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  learner_language: string;
  target_language: string;
  price_usd: number;
  price_pen: number | null;
  cover_image_url: string | null;
  is_upsell: boolean;
  active: boolean;
  sort_order: number;
}

const FLAG: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷",
  de: "🇩🇪", it: "🇮🇹", ja: "🇯🇵", nl: "🇳🇱",
};

const LANG_NAME: Record<string, string> = {
  es: "Español", en: "Inglés", fr: "Francés", pt: "Portugués", ko: "Coreano",
  de: "Alemán", it: "Italiano", ja: "Japonés", nl: "Neerlandés",
};

function toProduct(p: DBProduct): Product {
  const flag = FLAG[p.target_language] ?? "🌐";
  const country = `${LANG_NAME[p.target_language] ?? p.target_language} para ${LANG_NAME[p.learner_language] ?? "todos"}`;
  return {
    id: p.sku,
    slug: p.sku,
    name: p.name,
    flag,
    country,
    image: p.cover_image_url || "/placeholder.svg",
    title: p.name,
    subtitle: country,
    description: p.description || "",
    rating: 4.9,
    reviews: 0,
    price: Number(p.price_usd) || 0,
    originalPrice: null,
    discount: null,
    badge: p.is_upsell ? "🎁 Upsell" : "🆕 Nuevo",
    features: [],
    isPhysical: false,
    formats: ["digital"],
    // Route DB products to their checkout page (no product page exists).
    externalUrl: `/checkouts/${p.sku}`,
  };
}

/** Fetches active products from the admin panel (digital_products table). */
export function useDigitalProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("digital_products")
        .select("id, sku, name, description, learner_language, target_language, price_usd, price_pen, cover_image_url, is_upsell, active, sort_order")
        .eq("active", true)
        .eq("is_upsell", false)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data) setItems((data as DBProduct[]).map(toProduct));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}
