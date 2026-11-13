import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WHOP_COUNTRIES } from "@/lib/whopCountries";

const COUNTRY_NAMES: Record<string, string> = { CO: "Colombia", CL: "Chile", AR: "Argentina" };
const WALLET_LABELS: Record<string, string> = { nequi: "Nequi", mercado_pago: "Mercado Pago", mercado_pago_ar: "Mercado Pago", modo: "MODO", addi: "Addi (cuotas)" };
const REASONS: Record<string, string> = {
  not_configured: "faltan los secretos WHOP_API_KEY o WHOP_WEBHOOK_SECRET en el servidor",
  country_not_supported: "país sin Whop",
};

type Status = { state: "idle" | "loading" | "ok" | "fail"; reason?: string };

/**
 * Whop (billetera y Addi) NO se enciende por región como los demás métodos: cobra siempre en Colombia, Chile y Argentina y
 * reemplaza la billetera de dLocal Go; si Whop no está listo, el checkout vuelve solo a dLocal Go. Aquí se ve qué hace en cada
 * país y se puede comprobar al instante si el servidor lo tiene listo (no crea pedidos ni cobra).
 */
export const WhopStatusCard = () => {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);

  async function probe() {
    setBusy(true);
    setStatus(Object.fromEntries(Object.keys(WHOP_COUNTRIES).map((c) => [c, { state: "loading" } as Status])));
    const next: Record<string, Status> = {};
    for (const c of Object.keys(WHOP_COUNTRIES)) {
      try {
        const { data, error } = await supabase.functions.invoke("whop-create-order", { body: { probe: true, country: c } });
        if (!error && (data as { available?: boolean } | null)?.available === true) { next[c] = { state: "ok" }; continue; }
        let reason = "";
        try { reason = String((await (error as unknown as { context?: Response })?.context?.json?.())?.reason ?? ""); } catch { /* sin detalle */ }
        next[c] = { state: "fail", reason: REASONS[reason] ?? (reason || "el servidor no respondió") };
      } catch {
        next[c] = { state: "fail", reason: "el servidor no respondió" };
      }
    }
    setStatus(next);
    setBusy(false);
  }

  return (
    <Card className="p-3 sm:p-4 border-primary/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold"><Smartphone className="w-4 h-4" /> Whop · Billetera y Addi</div>
        <Button size="sm" variant="outline" className="h-9 w-full sm:w-auto" disabled={busy} onClick={probe}>
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Comprobar ahora
        </Button>
      </div>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        Siempre activo en estos países y reemplaza la billetera de dLocal Go. Si Whop no está listo o falla, el checkout vuelve solo a dLocal Go (Addi avisa que no está disponible).
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {Object.entries(WHOP_COUNTRIES).map(([code, cfg]) => {
          const st = status[code];
          return (
            <li key={code} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium w-24">{COUNTRY_NAMES[code] ?? code}</span>
              <span className="text-muted-foreground">
                Billetera: {[...new Set(cfg.wallet.map((w) => WALLET_LABELS[w] ?? w))].join(" · ")}
                {cfg.installments?.length ? ` · ${cfg.installments.map((w) => WALLET_LABELS[w] ?? w).join(", ")}` : ""} · {cfg.currency}
              </span>
              {st?.state === "ok" && <Badge className="bg-emerald-600 text-white">Listo</Badge>}
              {st?.state === "fail" && <Badge variant="destructive" title={st.reason}>No disponible</Badge>}
              {st?.state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {st?.state === "fail" && st.reason && <span className="text-xs text-destructive">({st.reason})</span>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
