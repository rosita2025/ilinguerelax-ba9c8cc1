import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, Building2, Wallet } from "lucide-react";
import { formatAmountLocalized } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { toast } from "@/hooks/use-toast";

const USD_TO_PEN = 3.75;

export function MercadoPagoButton() {
  const { items, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { total } = calcTotals(items, couponPercent, region.tier);
  const [loading, setLoading] = useState(false);
  const redirectingRef = useRef(false);

  const totalPen = formatAmountLocalized(total * USD_TO_PEN, 2);

  useEffect(() => {
    const resetLoading = () => {
      redirectingRef.current = false;
      setLoading(false);
    };

    window.addEventListener("pageshow", resetLoading);
    window.addEventListener("focus", resetLoading);

    return () => {
      window.removeEventListener("pageshow", resetLoading);
      window.removeEventListener("focus", resetLoading);
    };
  }, []);

  const handlePay = async () => {
    if (redirectingRef.current) return;

    const latestCart = useCheckoutPruebaStore.getState();
    const latestTotals = calcTotals(latestCart.items, latestCart.couponPercent, region.tier);
    const orderId = `ILR-MP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (latestCart.items.length === 0) {
      toast({ title: "Carrito vacío", variant: "destructive" });
      return;
    }
    const b = latestCart.buyer;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim());
    if (b.fullName.trim().length < 3 || !emailOk) {
      toast({
        title: "Datos requeridos",
        description: "Completa tu nombre y correo antes de pagar.",
        variant: "destructive",
      });
      return;
    }
    redirectingRef.current = true;
    setLoading(true);
    try {
      // Guardar contacto (best-effort, vía edge function con service-role)
      captureEmailContact({
        email: b.email.trim().toLowerCase(),
        name: b.fullName.trim(),
        metadata: { phone: b.phone ?? "", processor: "mercadopago" },
      });


      const { data, error } = await supabase.functions.invoke("create-mercadopago-preference", {
        body: {
          orderId,
          items: latestCart.items.map((i) => ({
            id: i.id,
            name: i.name,
            price: itemPrice(i, region.tier),
            quantity: i.quantity,
            image: i.image,
            description: i.description,
          })),
          couponPercent: latestCart.couponPercent,
          couponCode: latestCart.coupon ?? undefined,
          payerEmail: b.email.trim(),
          payerName: b.fullName.trim(),
          payerPhone: b.phone ?? undefined,
          usdToPen: USD_TO_PEN,
          expectedTotalUsd: Number(latestTotals.total.toFixed(2)),
          returnUrl: `${window.location.origin}/checkouts/return`,
          successUrl: `${window.location.origin}/checkouts/success`,
          failureUrl: `${window.location.origin}/checkouts/failure`,
          pendingUrl: `${window.location.origin}/checkouts/pending`,
          autoReturn: "approved",
        },
      });
      if (error || !data?.init_point) {
        throw new Error(error?.message || "No se pudo crear la preferencia");
      }
      // init_point = producción; sandbox_init_point = pruebas
      window.location.assign(data.init_point);
    } catch (err) {
      redirectingRef.current = false;
      toast({
        title: "Error Mercado Pago",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          O paga desde Perú 🇵🇪
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={loading || items.length === 0}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirigiendo a Mercado Pago…
          </>
        ) : (
          <>
            Pagar con Mercado Pago · S/ {totalPen} (≈ ${total.toFixed(2)} USD)
          </>
        )}
      </button>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="font-medium">Yape / Plin</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="font-medium">BCP · BBVA · IBK</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-medium">PagoEfectivo</span>
        </div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground mt-2">
        Serás redirigido al entorno seguro de Mercado Pago. Tipo de cambio referencial: 1 USD ≈ S/ {USD_TO_PEN}
      </p>
    </div>
  );
}
