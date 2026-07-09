import { useState } from "react";
import { Loader2, Smartphone, Building2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore, calcTotals } from "@/stores/checkoutPruebaStore";
import { toast } from "@/hooks/use-toast";

const USD_TO_PEN = 3.75;

export function MercadoPagoButton() {
  const { items, coupon, couponPercent } = useCheckoutPruebaStore();
  const { total } = calcTotals(items, couponPercent);
  const [loading, setLoading] = useState(false);

  const totalPen = (total * USD_TO_PEN).toFixed(2);

  const handlePay = async () => {
    if (items.length === 0) {
      toast({ title: "Carrito vacío", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-mercadopago-preference", {
        body: {
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            description: i.description,
          })),
          couponPercent,
          couponCode: coupon ?? undefined,
          usdToPen: USD_TO_PEN,
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
      window.location.href = data.init_point;
    } catch (err) {
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
        className="w-full bg-[#00b1ea] hover:bg-[#009ed1] text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirigiendo a Mercado Pago…
          </>
        ) : (
          <>
            Pagar con Mercado Pago · S/ {totalPen}
          </>
        )}
      </button>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Smartphone className="w-4 h-4 text-[#00b1ea]" />
          <span className="font-medium">Yape / Plin</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Building2 className="w-4 h-4 text-[#00b1ea]" />
          <span className="font-medium">BCP · BBVA · IBK</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/40">
          <Wallet className="w-4 h-4 text-[#00b1ea]" />
          <span className="font-medium">PagoEfectivo</span>
        </div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground mt-2">
        Serás redirigido al entorno seguro de Mercado Pago. Tipo de cambio referencial: 1 USD ≈ S/ {USD_TO_PEN}
      </p>
    </div>
  );
}
