import { useEffect, useState } from "react";
import { Shield, Trash2, RefreshCw, MessageCircle, Timer, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";

interface Ban {
  ip: string;
  reason: string;
  banned_until: string;
  ua: string | null;
  hits: number;
  created_at: string;
}

interface CartInfo {
  name: string;
  phone: string;
  started: string | null;
  last_activity: string | null;
  recover_url: string | null;
}

interface StatRow {
  ip: string;
  count: number;
  payment_method?: string | null;
  providers?: string[];
  first?: string;
  duration_sec?: number;
  cart?: CartInfo | null;
  last: string;
  slugs: string[];
  sources: string[];
  referers: string[];
  ua: string | null;
  country?: string | null;
  city?: string | null;
  email?: string | null;
  status?: "purchased" | "abandoned" | "browsing" | "anonymous";
  client_purchase_event?: boolean;
  reminders?: number;
}

interface SourceRow {
  source: string;
  count: number;
}

interface CountryRow {
  country: string;
  count: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  PE: "Perú", MX: "México", CO: "Colombia", AR: "Argentina", CL: "Chile", EC: "Ecuador",
  VE: "Venezuela", BO: "Bolivia", PY: "Paraguay", UY: "Uruguay", BR: "Brasil", US: "Estados Unidos",
  ES: "España", CA: "Canadá", GT: "Guatemala", CR: "Costa Rica", PA: "Panamá", DO: "Rep. Dominicana",
  HN: "Honduras", SV: "El Salvador", NI: "Nicaragua", CU: "Cuba", PR: "Puerto Rico", IT: "Italia",
  FR: "Francia", DE: "Alemania", GB: "Reino Unido", PT: "Portugal", KR: "Corea del Sur", JP: "Japón",
};

function flagEmoji(code?: string | null) {
  const c = (code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🌐";
  return String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0)));
}

function CountryBadge({ code }: { code?: string | null }) {
  const c = (code || "").toUpperCase();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted text-foreground border-border">
      <span aria-hidden>{flagEmoji(c)}</span>
      {c ? COUNTRY_NAMES[c] || c : "País desconocido"}
    </span>
  );
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  purchased: { label: "✅ Compró", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  abandoned: { label: "🛒 Abandonó el carrito", className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  browsing: { label: "✍️ Dejó su correo, sin comprar", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  anonymous: { label: "👤 Sin correo (solo visita)", className: "bg-muted text-muted-foreground border-border" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_META[status || "anonymous"] || STATUS_META.anonymous;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.className}`}>
      {s.label}
    </span>
  );
}

const SOURCE_LABEL: Record<string, { label: string; emoji: string; className: string }> = {
  instagram: { label: "Instagram", emoji: "📸", className: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  facebook: { label: "Facebook", emoji: "👤", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  tiktok: { label: "TikTok", emoji: "🎵", className: "bg-black/10 text-foreground border-foreground/30" },
  whatsapp: { label: "WhatsApp", emoji: "💬", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  telegram: { label: "Telegram", emoji: "✈️", className: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
  threads: { label: "Threads", emoji: "🧵", className: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30" },
  youtube: { label: "YouTube", emoji: "▶️", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  google: { label: "Google", emoji: "🔎", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  "google-app": { label: "Google App", emoji: "🔎", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  bing: { label: "Bing", emoji: "🔎", className: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30" },
  duckduckgo: { label: "DuckDuckGo", emoji: "🦆", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  yandex: { label: "Yandex", emoji: "🔎", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  email: { label: "Correo", emoji: "✉️", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
  internal: { label: "Interno", emoji: "🏠", className: "bg-primary/10 text-primary border-primary/30" },
  direct: { label: "Directo / desconocido", emoji: "🔗", className: "bg-muted text-muted-foreground border-border" },
  line: { label: "LINE", emoji: "💚", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  kakao: { label: "KakaoTalk", emoji: "💛", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABEL[source] || { label: source, emoji: "🌐", className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.className}`}>
      <span aria-hidden>{s.emoji}</span>{s.label}
    </span>
  );
}

/** 75 s → "1 min 15 s"; 0 → "menos de 1 s". */
function fmtDuration(sec?: number | null) {
  const s = Math.max(0, Math.round(sec ?? 0));
  if (s < 1) return "menos de 1 s";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

const DIAL: Record<string, string> = { PE: "51", MX: "52", CO: "57", AR: "54", CL: "56", EC: "593", BO: "591", PY: "595", UY: "598", VE: "58", ES: "34", US: "1", CA: "1", BR: "55", GT: "502", CR: "506", PA: "507", DO: "1", SV: "503", HN: "504", NI: "505", PR: "1", IT: "39", FR: "33", DE: "49", GB: "44", PT: "351" };

/** Teléfono → solo dígitos con prefijo de país (si lo escribió sin él). null si no sirve. */
function waNumber(phone?: string | null, country?: string | null) {
  const raw = (phone || "").trim();
  let d = raw.replace(/\D/g, "");
  if (d.length < 7) return null;
  if (!raw.startsWith("+") && !raw.startsWith("00")) {
    const dial = DIAL[(country || "").toUpperCase()];
    if (dial && !d.startsWith(dial) && d.length <= 10) d = dial + d.replace(/^0+/, "");
  }
  return d.replace(/^00/, "");
}

/** WhatsApp con el mensaje ya escrito para retomar un carrito abandonado. */
function recoveryWaUrl(opts: { phone?: string | null; country?: string | null; name?: string | null; slugs?: string[]; recoverUrl?: string | null }) {
  const num = waNumber(opts.phone, opts.country);
  if (!num) return null;
  const first = (opts.name || "").trim().split(/\s+/)[0];
  const product = (opts.slugs ?? [])[0]?.replace(/-/g, " ");
  const lines = [
    `Hola${first ? ` ${first}` : ""}, soy de iLingue Relax 👋`,
    `Vi que dejaste tu pedido${product ? ` de "${product}"` : ""} a medias. ¿Tuviste algún problema con el pago o te ayudo a terminar tu compra?`,
  ];
  if (opts.recoverUrl) lines.push(`Aquí puedes retomarlo: ${opts.recoverUrl}`);
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function WhatsAppFollowUp({ url }: { url: string | null }) {
  if (!url) return <span className="text-xs text-muted-foreground">Sin teléfono para WhatsApp</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#25D366] text-white hover:bg-[#20b358]"
    >
      <MessageCircle className="h-3.5 w-3.5" /> Escribir por WhatsApp
    </a>
  );
}

/** Qué hizo en el checkout, en una frase. */
function activityLabel(r: { status?: string; email?: string | null; cart?: CartInfo | null }) {
  if (r.status === "purchased") return "Completó la compra";
  if (r.status === "abandoned") return "Llenó sus datos y dejó el carrito abierto";
  if (r.email) return "Dejó su correo pero no llegó a pagar";
  return "Solo vio el checkout: no llenó el formulario ni el carrito";
}

/** Modelo de teléfono / navegador a partir del user-agent (lo que el navegador deja ver). */
function parseDevice(ua?: string | null): { device: string; browser: string } {
  const u = ua || "";
  if (!u) return { device: "Desconocido", browser: "—" };
  let browser = "Navegador";
  if (/Instagram/i.test(u)) browser = "App de Instagram";
  else if (/FBAN|FBAV|FB_IAB/i.test(u)) browser = "App de Facebook";
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(u)) browser = "App de TikTok";
  else if (/EdgA?\//.test(u)) browser = "Edge";
  else if (/SamsungBrowser/i.test(u)) browser = "Samsung Internet";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Firefox|FxiOS/i.test(u)) browser = "Firefox";
  else if (/CriOS|Chrome\//.test(u)) browser = "Chrome";
  else if (/Safari\//.test(u)) browser = "Safari";
  else if (/bot|crawl|spider|headless/i.test(u)) browser = "Bot";

  const ios = u.match(/OS (\d+)[_.](\d+)/);
  if (/iPhone/.test(u)) return { device: `iPhone · iOS ${ios ? ios[1] : ""}`.trim(), browser };
  if (/iPad/.test(u)) return { device: `iPad · iOS ${ios ? ios[1] : ""}`.trim(), browser };
  const and = u.match(/Android\s([\d.]+)(?:;\s*((?:[^;()]|\([^)]*\))+))?/);
  if (and) {
    let model = (and[2] || "").replace(/\s*Build\/.*$/i, "").trim();
    if (!model || model === "K" || /^wv$/i.test(model)) return { device: `Android ${and[1].split(".")[0]} (modelo oculto)`, browser };
    const brand =
      /^SM-|^GT-/i.test(model) ? "Samsung " :
      /^(Redmi|M\d{4}|2\d{6,}|POCO|Mi )/i.test(model) ? "Xiaomi " :
      /^(CPH|PH[A-Z]\d)/i.test(model) ? "Oppo " :
      /^RMX/i.test(model) ? "Realme " :
      /^(moto|XT\d)/i.test(model) ? "Motorola " :
      /^(V\d{4}|vivo)/i.test(model) ? "Vivo " :
      /^(TECNO|Infinix|itel)/i.test(model) ? "" :
      /^Pixel/i.test(model) ? "Google " :
      /^(LM-|LG)/i.test(model) ? "LG " :
      /^(HUAWEI|[A-Z]{3}-L\d)/i.test(model) ? "Huawei " : "";
    return { device: `${brand}${model} · Android ${and[1].split(".")[0]}`, browser };
  }
  if (/Windows NT/.test(u)) return { device: "PC Windows", browser };
  if (/Macintosh/.test(u)) return { device: "Mac", browser };
  if (/CrOS/.test(u)) return { device: "Chromebook", browser };
  if (/Linux/.test(u)) return { device: "Linux", browser };
  return { device: "Otro dispositivo", browser };
}

type MethodTag = { label: string; className: string };
const METHOD_TAGS: Array<[RegExp, MethodTag]> = [
  [/hotmart/, { label: "Hotmart", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" }],
  [/binance/, { label: "Binance", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" }],
  [/yape|plin/, { label: "Yape / Plin", className: "bg-purple-500/10 text-purple-700 border-purple-500/30" }],
  [/paypal/, { label: "PayPal", className: "bg-sky-500/10 text-sky-700 border-sky-500/30" }],
  [/dlocal/, { label: "dLocal Go", className: "bg-teal-500/10 text-teal-700 border-teal-500/30" }],
  [/mercadopago|^cash$|^transfer$/, { label: "Mercado Pago", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" }],
  [/clabe|spei/, { label: "SPEI", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" }],
  [/stripe|card|link|apple|google|klarna|ach|cashapp|bizum|ideal|satispay|mbway|crypto/, { label: "Stripe", className: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30" }],
];
const methodTagFor = (m?: string | null): MethodTag | null => {
  const k = (m || "").toLowerCase();
  if (!k || k === "not_selected") return null;
  const hit = METHOD_TAGS.find(([re]) => re.test(k));
  return hit ? hit[1] : { label: k, className: "bg-muted text-foreground border-border" };
};

/** Qué método pulsó el cliente: etiqueta clara, o por qué no pulsó ninguno. */
function PaymentMethodTag({ r }: { r: { email?: string | null; payment_method?: string | null; providers?: string[]; status?: string } }) {
  if (!r.email) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground border-border" title="No llenó nombre ni correo, así que ni siquiera llegó a elegir un método de pago">
        ⛔ No pulsó ningún método (no llenó datos)
      </span>
    );
  }
  const tag = methodTagFor(r.payment_method) ?? methodTagFor((r.providers ?? [])[0]);
  if (!tag) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-amber-500/10 text-amber-700 border-amber-500/30" title="Dejó su correo pero no pulsó ningún método de pago">
        ⏸ Dejó datos, no eligió método
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${tag.className}`} title="Último método de pago que pulsó">
      👆 Pulsó: {tag.label}
    </span>
  );
}

interface Summary {
  visits: number;
  visitors: number;
  with_email: number;
  without_email: number;
  purchased: number;
  abandoned: number;
  countries: number;
  avg_duration_sec?: number;
  generated_at: string;
}

interface Lead {
  email: string;
  country?: string | null;
  city?: string | null;
  status?: string;
  first?: string;
  duration_sec?: number;
  cart?: CartInfo | null;
  last: string;
  slugs?: string[];
  reminders?: number;
  client_purchase_event?: boolean;
}

function ClientPurchaseWarning() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-red-500/10 text-red-600 border-red-500/30"
      title="El navegador reportó una compra, pero NO hay pago confirmado en la pasarela. Posible pago fallido o falso positivo."
    >
      ⚠️ Compra no confirmada
    </span>
  );
}

export default function AdminCheckoutAbuse() {
  const { toast } = useToast();
  const [bans, setBans] = useState<Ban[]>([]);
  const [top, setTop] = useState<StatRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<"today" | "yesterday" | "24h">("today");
  const [onlyReal, setOnlyReal] = useState(true);
  const [hiddenVisits, setHiddenVisits] = useState(0);
  const [tab, setTab] = useState<"filled" | "empty">("filled");
  const [countryFilter, setCountryFilter] = useState("");
  const [shown, setShown] = useState(25);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        adminInvoke("manage-checkout-abuse", { body: { action: "list_bans" } }),
        adminInvoke("manage-checkout-abuse", { body: { action: "stats", range, tz_offset: new Date().getTimezoneOffset(), only_real: onlyReal } }),
      ]);
      if (b.error) throw b.error;
      if (s.error) throw s.error;
      setBans(((b.data as { bans?: Ban[] } | null)?.bans) ?? []);
      const stats = s.data as { top?: StatRow[]; sources?: SourceRow[]; countries?: CountryRow[]; summary?: Summary; leads?: Lead[]; hidden_visits?: number } | null;
      setHiddenVisits(stats?.hidden_visits ?? 0);
      setTop(stats?.top ?? []);
      setSources(stats?.sources ?? []);
      setCountries(stats?.countries ?? []);
      setSummary(stats?.summary ?? null);
      setLeads(stats?.leads ?? []);
      setUpdatedAt(new Date());
    } catch {
      toast({ title: "Error al cargar datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const iv = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, onlyReal]);


  const deleteVisitor = async (ip: string) => {
    if (!confirm(`¿Borrar de la lista las visitas de ${ip} (${rangeLabel})? Úsalo para pruebas propias o duplicados.`)) return;
    try {
      const { error } = await adminInvoke("manage-checkout-abuse", { body: { action: "delete_visitor", ip, range, tz_offset: new Date().getTimezoneOffset() } });
      if (error) throw error;
      toast({ title: "Visitas borradas de la lista" });
      void load();
    } catch {
      toast({ title: "No se pudo borrar", variant: "destructive" });
    }
  };

  const unban = async (ip: string) => {
    if (!confirm(`¿Desbloquear IP ${ip}?`)) return;
    try {
      const { error } = await adminInvoke("manage-checkout-abuse", { body: { action: "unban", ip } });
      if (error) throw error;
      toast({ title: "IP desbloqueada" });
      void load();
    } catch {
      toast({ title: "Error al desbloquear", variant: "destructive" });
    }
  };

  // Con correo: una fila por correo (la visita más reciente); sin llenar: una fila por IP.
  const withEmail = (() => {
    const m = new Map<string, StatRow>();
    for (const r of top) {
      if (!r.email) continue;
      const k = r.email.trim().toLowerCase();
      const prev = m.get(k);
      if (!prev || String(r.last) > String(prev.last)) m.set(k, r);
    }
    return [...m.values()].sort((a, b) => String(b.last).localeCompare(String(a.last)));
  })();
  const withoutEmail = top.filter((r) => !r.email).sort((a, b) => String(b.last).localeCompare(String(a.last)));
  const countryOptions = (() => {
    const m = new Map<string, number>();
    for (const r of tab === "filled" ? withEmail : withoutEmail) {
      const c = (r.country || "").toUpperCase();
      if (c) m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  })();
  const visible = (tab === "filled" ? withEmail : withoutEmail).filter((r) => !countryFilter || (r.country || "").toUpperCase() === countryFilter);

  const rangeLabel = range === "today" ? `hoy (${new Date().toLocaleDateString("es", { day: "numeric", month: "long" })})` : range === "yesterday" ? `ayer (${new Date(Date.now() - 86400000).toLocaleDateString("es", { day: "numeric", month: "long" })})` : "las últimas 24 h";

  const activeBans = bans.filter((b) => new Date(b.banned_until) > new Date());

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Checkout · anti-abuso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Datos reales de {rangeLabel} · se actualiza solo cada 30 s
              {updatedAt ? ` · actualizado ${updatedAt.toLocaleTimeString()}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {([["today", "Hoy"], ["yesterday", "Ayer"], ["24h", "Últimas 24 h"]] as const).map(([k, label]) => (
              <Button key={k} size="sm" variant={range === k ? "default" : "outline"} onClick={() => { setRange(k); setShown(25); setCountryFilter(""); }}>
                {label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refrescar
            </Button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Visitantes", value: summary.visitors, hint: `${summary.visits} visitas` },
              { label: "Países", value: summary.countries, hint: "distintos" },
              { label: "Dejaron correo", value: summary.with_email, hint: "identificados" },
              { label: "Sin correo", value: summary.without_email, hint: "no llenó formulario" },
              { label: "Compraron", value: summary.purchased, hint: "confirmadas" },
              { label: "Abandonaron", value: summary.abandoned, hint: "carrito abierto" },
              { label: "Tiempo medio", value: fmtDuration(summary.avg_duration_sec), hint: "en el checkout" },
            ].map((k) => (
              <div key={k.label} className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className={`font-bold ${typeof k.value === "string" ? "text-lg leading-8" : "text-2xl"}`}>{k.value}</div>
                <div className="text-[11px] text-muted-foreground">{k.hint}</div>
              </div>
            ))}
          </div>
        )}

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b space-y-3">
            <div>
              <h2 className="font-semibold">Visitantes del checkout · {rangeLabel}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Separados en dos pestañas: quienes dejaron su correo y quienes solo miraron. Con país, duración y modelo de teléfono.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {([
                ["filled", `✍️ Con correo (${withEmail.length})`],
                ["empty", `👤 Sin llenar (${withoutEmail.length})`],
              ] as const).map(([k, label]) => (
                <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => { setTab(k); setShown(25); }}>
                  {label}
                </Button>
              ))}
              <select
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setShown(25); }}
                className="h-9 rounded-md border bg-background px-2 text-sm ml-auto"
                aria-label="Filtrar por país"
              >
                <option value="">🌐 Todos los países</option>
                {countryOptions.map(([code, n]) => (
                  <option key={code} value={code}>{flagEmoji(code)} {COUNTRY_NAMES[code] || code} ({n})</option>
                ))}
              </select>
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={onlyReal} onChange={(e) => { setOnlyReal(e.target.checked); setShown(25); }} />
              <span>
                <strong className="text-foreground">Solo tráfico real</strong>: anuncios de Meta y TikTok, redes sociales y orgánico (Google…).
                Oculta visitas directas sin origen y las de nuestro propio sitio (pruebas del equipo)
                {onlyReal && hiddenVisits > 0 ? ` · ${hiddenVisits} visitas ocultas` : ""}.
              </span>
            </label>
          </div>
          {visible.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              {tab === "filled" ? "Nadie dejó su correo en este filtro." : "Sin visitantes sin llenar en este filtro."}
            </p>
          ) : (
            <div className="divide-y">
              {visible.slice(0, shown).map((r) => {
                const d = parseDevice(r.ua);
                const waUrl = r.status === "abandoned"
                  ? recoveryWaUrl({ phone: r.cart?.phone, country: r.country, name: r.cart?.name, slugs: r.slugs, recoverUrl: r.cart?.recover_url })
                  : null;
                return (
                  <details key={r.ip} className="group p-3">
                    <summary className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm cursor-pointer list-none">
                      <CountryBadge code={r.country} />
                      {r.city && <span className="text-xs text-muted-foreground">📍 {r.city}</span>}
                      <span className="inline-flex items-center gap-1 text-xs" title="Modelo de teléfono / dispositivo">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> {d.device}
                        <span className="text-muted-foreground">· {d.browser}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs" title="Tiempo entre su primera y última visita al checkout">
                        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                        {r.count > 1 ? fmtDuration(r.duration_sec) : "1 visita"}
                      </span>
                      <span className={`text-xs font-semibold ${r.count > 20 ? "text-destructive" : "text-muted-foreground"}`}>{r.count} hits</span>
                      <StatusBadge status={r.status} />
                      <PaymentMethodTag r={r} />
                      {r.client_purchase_event && <ClientPurchaseWarning />}
                      {r.email && (
                        <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary hover:underline break-all">{r.email}</a>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.last).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); void deleteVisitor(r.ip); }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        title="Borrar esta visita de la lista"
                        aria-label="Borrar esta visita"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </summary>
                    <div className="mt-2 pl-1 space-y-1.5 text-xs">
                      <p className="text-foreground">{activityLabel(r)}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(r.sources.length ? r.sources : ["direct"]).map((src) => <SourceBadge key={src} source={src} />)}
                        {r.first && <span className="text-muted-foreground">Primera visita: {new Date(r.first).toLocaleTimeString()}</span>}
                        <span className="font-mono text-muted-foreground">{r.ip}</span>
                        {(r.reminders ?? 0) > 0 && <span className="text-muted-foreground">· {r.reminders} recordatorio(s) enviados</span>}
                        {r.status === "abandoned" && <WhatsAppFollowUp url={waUrl} />}
                      </div>
                      {r.slugs.length > 0 && (
                        <div><span className="text-muted-foreground">Vio: </span>{r.slugs.join(", ")}</div>
                      )}
                      {r.referers.length > 0 && (
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">Origen:</span>
                          {r.referers.map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline truncate" title={u}>{u}</a>
                          ))}
                        </div>
                      )}
                      {r.ua && <div className="text-[10px] text-muted-foreground break-all">{r.ua}</div>}
                    </div>
                  </details>
                );
              })}
              {visible.length > shown && (
                <div className="p-3 text-center">
                  <Button variant="outline" size="sm" onClick={() => setShown((n) => n + 25)}>
                    Ver más ({visible.length - shown} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>



        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <h2 className="font-semibold">IPs bloqueadas ({activeBans.length})</h2>
          </div>
          {activeBans.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No hay IPs bloqueadas ahora mismo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">IP</th>
                    <th className="text-left px-3 py-2">Motivo</th>
                    <th className="text-left px-3 py-2">Hits</th>
                    <th className="text-left px-3 py-2">Hasta</th>
                    <th className="text-left px-3 py-2">User Agent</th>
                    <th className="text-right px-3 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBans.map((b) => (
                    <tr key={b.ip} className="border-t">
                      <td className="px-3 py-2 font-mono">{b.ip}</td>
                      <td className="px-3 py-2">{b.reason}</td>
                      <td className="px-3 py-2">{b.hits}</td>
                      <td className="px-3 py-2">{new Date(b.banned_until).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[280px]" title={b.ua || ""}>
                        {b.ua?.slice(0, 60) || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => void unban(b.ip)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Desbloquear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Origen del tráfico · {rangeLabel}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              De dónde vienen los visitantes que abren el checkout. Instagram/Facebook = humanos reales desde anuncios.
            </p>
          </div>
          {sources.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Sin actividad reciente.</p>
          ) : (
            <div className="p-4 flex flex-wrap gap-2">
              {sources.map((s) => (
                <div key={s.source} className="flex items-center gap-2">
                  <SourceBadge source={s.source} />
                  <span className="font-mono text-sm">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Países · {rangeLabel}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Desde qué país se abre el checkout. Útil para saber si el método de pago mostrado es el correcto.
            </p>
          </div>
          {countries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Sin datos de país todavía.</p>
          ) : (
            <div className="p-4 flex flex-wrap gap-2">
              {countries.map((c) => (
                <div key={c.country} className="flex items-center gap-2">
                  <CountryBadge code={c.country} />
                  <span className="font-mono text-sm">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
