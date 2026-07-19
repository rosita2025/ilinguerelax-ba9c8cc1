import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Star, Search, ArrowRight, Globe, ShoppingBag, CreditCard, Wallet, Package, Mail, Activity, Users, ClipboardList, LineChart, GitCompare, ShieldCheck, Send, Shield } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";

type Category = "Ventas" | "Productos" | "Marketing" | "Analítica" | "Seguridad";

const panels: Array<{
  to: string;
  icon: typeof Globe;
  title: string;
  desc: string;
  color: string;
  category: Category;
}> = [
  { to: "/admin/live", icon: Globe, title: "Visitas en vivo", desc: "Mapa mundial en tiempo real con visitantes activos, país, página y fuente de tráfico.", color: "text-primary", category: "Analítica" },
  { to: "/admin/reviews", icon: Star, title: "Reseñas", desc: "Modera reseñas enviadas: aprueba, rechaza y responde. Se muestran públicamente al aprobarlas.", color: "text-amber-500", category: "Marketing" },
  { to: "/admin/seo", icon: Search, title: "SEO · Google", desc: "Top queries y landing pages desde Google Search Console. Clics, impresiones, CTR y posición.", color: "text-emerald-500", category: "Analítica" },
  { to: "/admin/checkout-methods", icon: CreditCard, title: "Métodos de pago Stripe", desc: "Qué métodos verá cada comprador por país (DE, UK, JP, US, LatAm, Asia) y cuáles tienes activados.", color: "text-indigo-500", category: "Ventas" },
  { to: "/admin/manual-payments", icon: Wallet, title: "Pagos manuales · Yape/Plin", desc: "Órdenes generadas al pulsar 'Ya pagué'. Verifica el pago recibido en Yape/Plin y marca como verificada.", color: "text-fuchsia-500", category: "Ventas" },
  { to: "/admin/binance-config", icon: Wallet, title: "Binance Pay · Configuración", desc: "Edita el Pay ID, wallet, titular y QR de Binance por región (DEFAULT, PE, US, GLOBAL) sin tocar código.", color: "text-yellow-500", category: "Ventas" },
  { to: "/admin/purchases-status", icon: CreditCard, title: "Pagos · Estado unificado", desc: "Todas las compras (Hotmart, Mercado Pago, PayPal, Stripe, manuales) con estado, motivo de bloqueo y paso que falló.", color: "text-blue-500", category: "Ventas" },
  { to: "/admin/productos", icon: Package, title: "Productos digitales", desc: "Catálogo tipo Shopify: crea productos, precios, enlaces de Drive y upsells sin tocar código. Se sincroniza con checkout y correos.", color: "text-teal-600", category: "Productos" },
  { to: "/admin/orders", icon: Mail, title: "Órdenes / Pedidos", desc: "Lista de pedidos con estado de entrega digital, SKUs enviados y confirmación de correo (delivered / opened / bounced).", color: "text-sky-600", category: "Ventas" },
  { to: "/admin/hotmart-audit", icon: ClipboardList, title: "Hotmart · Auditoría", desc: "Eventos recibidos de Hotmart y carritos abandonados con estado mapeado (aprobado/pendiente/rechazado/posventa) y sync a Brevo.", color: "text-orange-500", category: "Ventas" },
  { to: "/admin/delivery-audit", icon: ShieldCheck, title: "Auditoría · Entrega digital", desc: "Trazabilidad por correo: qué SKU se resolvió, qué Drive se adjuntó (o por qué faltó) para cada envío digital automático.", color: "text-cyan-600", category: "Productos" },
  { to: "/admin/brevo-abandoned", icon: Send, title: "Brevo · Carritos abandonados", desc: "Payload real enviado a Brevo por cada carrito abandonado (tienda vs Hotmart) con ORIGEN, SEGMENTO, TAGS e IDs de producto.", color: "text-pink-600", category: "Marketing" },
  { to: "/admin/brevo-abandoned-stats", icon: LineChart, title: "Brevo · Dashboard abandonos", desc: "Tendencia diaria de abandonos Hotmart vs Tienda con filtro por COUNTRY_CODE y desglose por país.", color: "text-fuchsia-600", category: "Marketing" },
  { to: "/admin/newsletter-drip", icon: Mail, title: "Newsletter Drip · Test & Reenvío", desc: "Envía correos de prueba de cualquier paso del drip a un email cualquiera, o reenvía manualmente un paso a un suscriptor.", color: "text-purple-600", category: "Marketing" },
  { to: "/admin/analytics", icon: LineChart, title: "Analíticas · Funnel", desc: "Embudo estilo Shopify: sesiones, add-to-cart, checkout y compras. Conversiones, top productos por país y tendencias.", color: "text-violet-600", category: "Analítica" },
  { to: "/admin/ga4-compare", icon: GitCompare, title: "GA4 · Comparativa", desc: "Compara datos internos vs Google Analytics 4: usuarios, sesiones, eventos y fuentes de tráfico para detectar desviaciones.", color: "text-rose-500", category: "Analítica" },
  { to: "/admin/checkout-abuse", icon: Shield, title: "Anti-abuso · Checkout", desc: "IPs bloqueadas por rate limit, top IPs con más aperturas del checkout en 24 h y desbloqueo manual.", color: "text-red-500", category: "Seguridad" },
];

const CATEGORIES: Array<"Todos" | Category> = ["Todos", "Ventas", "Productos", "Marketing", "Analítica", "Seguridad"];

const AdminHome = () => {
  const [cat, setCat] = useState<"Todos" | Category>("Todos");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return panels.filter((p) => {
      if (cat !== "Todos" && p.category !== cat) return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        p.desc.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [cat, q]);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header>
            <h1 className="text-3xl font-bold">Panel de administración</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Todas tus herramientas internas en un solo lugar. La sesión queda activa hasta que cierres el navegador o pulses "Salir".
            </p>
          </header>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const count = c === "Todos" ? panels.length : panels.filter((p) => p.category === c).length;
                const active = cat === c;
                return (
                  <Button
                    key={c}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setCat(c)}
                    className="rounded-full"
                  >
                    {c} <span className="ml-1 opacity-60 text-xs">{count}</span>
                  </Button>
                );
              })}
            </div>
            <div className="relative md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar panel..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Sin resultados para "{q}".</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {filtered.map(({ to, icon: Icon, title, desc, color }) => (
                <Link key={to} to={to} className="group">
                  <Card className="p-6 h-full transition-all hover:shadow-lg hover:border-primary/40">
                    <Icon className={`w-8 h-8 ${color} mb-4`} />
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      {title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h2>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminHome;
