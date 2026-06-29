import { ShieldCheck, Smartphone, CreditCard, RefreshCw } from "lucide-react";
import pe1 from "@/assets/Compradoresperu1.webp.asset.json";
import pe2 from "@/assets/Compradoresperu2.webp.asset.json";
import pe3 from "@/assets/Compradoresperu3.webp.asset.json";
import pe4 from "@/assets/Compradoresperu4.webp.asset.json";
import pe5 from "@/assets/Compradoresperu5.webp.asset.json";
import pe6 from "@/assets/Compradoresperu6.webp.asset.json";
import pe7 from "@/assets/Compradoresperu7.webp.asset.json";
import mx1 from "@/assets/Compradoresmexico1.webp.asset.json";
import mx2 from "@/assets/Compradoresmexico2.webp.asset.json";

type Comprador = { src: string; country: "PE" | "MX"; flag: string; label: string; method: "Yape" | "Plin" | "Hotmart"; alt: string };

const compradores: Comprador[] = [
  { src: pe1.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — pago por Yape a Carmen Ali*" },
  { src: pe2.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — entrega del bono iLingue Relax" },
  { src: pe3.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — acceso al bono enviado" },
  { src: pe4.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — Yape Saenz Patrones de inglés" },
  { src: pe5.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — pago Yape a Carmen Ali*" },
  { src: pe6.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Yape", alt: "Comprador real desde Perú — Luis García pago por Yape" },
  { src: pe7.url, country: "PE", flag: "🇵🇪", label: "Perú", method: "Plin", alt: "Comprador real desde Perú — pago por Plin (Marino Baltazar)" },
  { src: mx1.url, country: "MX", flag: "🇲🇽", label: "México", method: "Hotmart", alt: "Comprador real desde México — transferencia Scotiabank a Hotmart" },
  { src: mx2.url, country: "MX", flag: "🇲🇽", label: "México", method: "Hotmart", alt: "Comprador real desde México — checkout Hotmart con entrega automática" },
];

const methodStyle: Record<Comprador["method"], string> = {
  Yape: "bg-purple-600 text-white",
  Plin: "bg-cyan-600 text-white",
  Hotmart: "bg-orange-500 text-white",
};

export const CompradoresReales = () => (
  <div className="mt-14">

    <div className="text-center mb-6">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-3">
        <ShieldCheck className="w-4 h-4" /> Compradores reales · 🇵🇪 🇲🇽
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        Comprobantes de <span className="text-gradient">compradores reales</span>
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Capturas reales de pagos (no son testimonios). Datos personales protegidos por privacidad.
        El nombre <strong>Carmen Ali*</strong> es la cuenta oficial verificada de iLingue Relax en Perú.
      </p>
    </div>

    <div className="max-w-3xl mx-auto mb-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 md:p-5 flex items-start gap-3">
      <RefreshCw className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
      <div>
        <p className="font-extrabold text-foreground text-sm md:text-base">
          🎁 Actualizaciones GRATUITAS de por vida para compradores
        </p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Recibirás <strong>más contenidos nuevos de Patrones Especiales</strong> (nuevas reglas,
          combinaciones secretas, audios y ejercicios) sin pagar nada extra. Una sola compra,
          mejoras para siempre.
        </p>
      </div>
    </div>


    <div className="max-w-3xl mx-auto mb-6 grid sm:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-foreground text-sm">🇵🇪 Perú · Yape y Plin</p>
          <p className="text-xs text-muted-foreground">Precio más económico en soles. Pago directo, rápido y seguro.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-foreground text-sm">🇲🇽 México · Hotmart</p>
          <p className="text-xs text-muted-foreground">Pago seguro y entrega automática del PDF al correo.</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {compradores.map((c) => (
        <figure
          key={c.src}
          className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card"
        >
          <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
            {c.flag} {c.label}
          </div>
          <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-[10px] font-bold ${methodStyle[c.method]}`}>
            {c.method}
          </div>
          <img
            src={c.src}
            alt={c.alt}
            loading="lazy"
            decoding="async"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-auto block"
          />
          <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">
            ✓ Pago verificado
          </div>
        </figure>
      ))}
    </div>
    <p className="text-center text-xs text-muted-foreground mt-4">
      Números, montos y datos sensibles ocultos por privacidad. Todas las capturas son de compradores reales.
    </p>
  </div>
);
