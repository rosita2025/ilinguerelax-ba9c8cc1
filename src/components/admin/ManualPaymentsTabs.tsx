import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Pestañas del bloque "Pago manual": una sola entrada en el menú, tres pantallas. */
export const MANUAL_PAYMENT_PATHS = ["/admin/manual-payments", "/admin/binance-config", "/admin/dlocal"];

const TABS = [
  { to: "/admin/manual-payments", label: "Pendientes y pagos manuales", hint: "Yape · Plin · SPEI · PayPal · dLocal · Mercado Pago" },
  { to: "/admin/binance-config", label: "Binance Pay", hint: "Cuenta y QR" },
  { to: "/admin/dlocal", label: "dLocal Go", hint: "Países y métodos" },
];

export default function ManualPaymentsTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Pago manual">
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={cn(
            "shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors",
            pathname === t.to ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <span className="block leading-tight">{t.label}</span>
          <span className="block text-[10px] font-normal opacity-70">{t.hint}</span>
        </Link>
      ))}
    </nav>
  );
}
