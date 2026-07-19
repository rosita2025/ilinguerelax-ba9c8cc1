import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { getCatalogItem, CHECKOUT_CATALOG } from "@/config/checkoutCatalog";
import { authorizeCheckout } from "@/lib/checkoutGate";

/**
 * /recuperar-carrito?t=<cart_token>
 *
 * Fetches the buyer's server-side persistent cart (all products they added
 * across sessions/devices) and hydrates the local checkout store so the
 * next /checkouts view shows every product in a single unified cart.
 */
export default function RecoverCart() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  const setBuyer = useCheckoutPruebaStore((s) => s.setBuyer);
  const [status, setStatus] = useState<"loading" | "empty" | "ok" | "error">("loading");
  const [count, setCount] = useState(0);

  const token = (params.get("t") || "").trim();

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    let cancelled = false;
    (async () => {
      try {
        const url = `https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/persistent-cart?token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) { if (!cancelled) setStatus("error"); return; }
        const data = await res.json() as {
          ok?: boolean;
          email?: string;
          items?: Array<{ id?: string; q?: number }>;
          buyer?: { name?: string; phone?: string };
        };
        if (!data?.ok || !Array.isArray(data.items) || data.items.length === 0) {
          if (!cancelled) setStatus("empty");
          return;
        }
        setBuyer({
          fullName: data.buyer?.name || "",
          email: data.email || "",
          phone: data.buyer?.phone || "",
        });

        let added = 0;
        let firstSku = "";
        for (const it of data.items) {
          const id = String(it?.id || "");
          if (!id) continue;
          const cat = getCatalogItem(id) || Object.values(CHECKOUT_CATALOG).find((x) => x.id === id);
          if (!cat) continue;
          if (!firstSku) firstSku = cat.id;
          addItem({
            id: cat.id,
            name: cat.name,
            price: cat.price,
            image: cat.image,
            description: cat.description,
            regionPrices: cat.regionPrices,
            pricePen: cat.pricePen,
          }, { silent: true });
          added++;
        }

        if (!added) { if (!cancelled) setStatus("empty"); return; }

        if (!cancelled) {
          setCount(added);
          setStatus("ok");
          // Auto-redirect to checkout so the buyer sees the full cart.
          if (firstSku) {
            authorizeCheckout(firstSku);
            setTimeout(() => navigate(`/checkouts/${firstSku}`, { replace: true }), 900);
          }
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token, addItem, setBuyer, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Helmet><title>Recuperando tu carrito · iLingue Relax</title><meta name="robots" content="noindex" /></Helmet>
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <h1 className="mt-4 text-xl font-bold">Recuperando tu carrito…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Estamos cargando todos los productos que dejaste guardados.</p>
          </>
        )}
        {status === "ok" && (
          <>
            <div className="text-4xl">✨</div>
            <h1 className="mt-3 text-xl font-bold">¡Listo! {count} {count === 1 ? "producto" : "productos"} en tu carrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">Te llevamos al checkout en un momento…</p>
          </>
        )}
        {status === "empty" && (
          <>
            <h1 className="text-xl font-bold">Tu carrito está vacío</h1>
            <p className="mt-2 text-sm text-muted-foreground">Parece que ya completaste tu compra o el carrito expiró.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold">
              Ver productos <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-bold">No pudimos recuperar tu carrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">El enlace puede haber expirado. Puedes seguir comprando desde nuestro catálogo.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold">
              Ver productos <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
