import { User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBuyerValid(buyer: { fullName: string; email: string }) {
  return buyer.fullName.trim().length >= 3 && EMAIL_RE.test(buyer.email.trim());
}

export function BuyerInfoForm() {
  const { buyer, setBuyer } = useCheckoutPruebaStore();
  const valid = isBuyerValid(buyer);

  return (
    <div className="rounded-xl border bg-background p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tus datos</h2>
          <p className="text-xs text-muted-foreground">
            Recibirás el acceso al producto digital por correo.
          </p>
        </div>
        {valid && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCircle2 className="w-4 h-4" /> Listo
          </span>
        )}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Nombre completo *</span>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              autoComplete="name"
              required
              value={buyer.fullName}
              onChange={(e) => setBuyer({ fullName: e.target.value })}
              placeholder="Ej. María López"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Correo electrónico *</span>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              autoComplete="email"
              required
              value={buyer.email}
              onChange={(e) => setBuyer({ email: e.target.value.trim() })}
              placeholder="tucorreo@email.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Aquí enviaremos tu acceso al producto digital.
          </p>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            WhatsApp (opcional)
          </span>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              autoComplete="tel"
              value={buyer.phone ?? ""}
              onChange={(e) => setBuyer({ phone: e.target.value })}
              placeholder="+51 999 999 999"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
