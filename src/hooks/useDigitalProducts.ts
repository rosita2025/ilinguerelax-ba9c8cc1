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
    learnerLanguage: p.learner_language as Product["learnerLanguage"],
    targetLanguage: p.target_language as Product["targetLanguage"],
    active: p.active,
    // Route DB products to their dynamic product page (Shopify-style /products/:sku).
    externalUrl: `/products/${p.sku}`,
  };
}

/** Fetches active products from the admin panel (digital_products table).
 *  Auto-refreshes on mount, on tab focus, and on realtime changes so that
 *  edits made in /admin/products propagate to the homepage and /products
 *  without a manual redeploy. */
export function useDigitalProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      let data: DBProduct[] | null = null;
      let error: unknown = null;
      try {
        const result = await supabase
          .from("digital_products")
          .select("id, sku, name, description, learner_language, target_language, price_usd, price_pen, cover_image_url, is_upsell, active, sort_order")
          .order("sort_order", { ascending: true });
        data = result.data as DBProduct[] | null;
        error = result.error;
      } catch (err) {
        error = err;
      }
      if (cancelled) return;
      if (!error && data) setItems(data.map(toProduct));
      setLoading(false);
    };

    fetchAll();

    // Refetch when the tab regains focus (covers reload-in-background & admin edits in another tab).
    const onFocus = () => { fetchAll(); };
    const onVisible = () => { if (document.visibilityState === "visible") fetchAll(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    // Realtime sobre `digital_products` fue desactivado por seguridad
    // (enviaba la fila completa, con enlaces de descarga, al navegador).
    const poll = window.setInterval(() => { fetchAll(); }, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(poll);
    };
  }, []);

  return { items, loading };
}
