import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BarChart3, Star, Search, ArrowRight, Globe, ShoppingBag, CreditCard, Wallet, Package, Mail, Activity, Users, ClipboardList, LineChart, GitCompare, ShieldCheck, Send } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";

const panels = [
  {
    to: "/admin/live",
    icon: Globe,
    title: "Visitas en vivo",
    desc: "Mapa mundial en tiempo real con visitantes activos, país, página y fuente de tráfico.",
    color: "text-primary",
  },
  {
    to: "/admin/reviews",
    icon: Star,
    title: "Reseñas",
    desc: "Modera reseñas enviadas: aprueba, rechaza y responde. Se muestran públicamente al aprobarlas.",
    color: "text-amber-500",
  },
  {
    to: "/admin/seo",
    icon: Search,
    title: "SEO · Google",
    desc: "Top queries y landing pages desde Google Search Console. Clics, impresiones, CTR y posición.",
    color: "text-emerald-500",
  },
  {
    to: "/admin/checkout-methods",
    icon: CreditCard,
    title: "Métodos de pago Stripe",
    desc: "Qué métodos verá cada comprador por país (DE, UK, JP, US, LatAm, Asia) y cuáles tienes activados.",
    color: "text-indigo-500",
  },
  {
    to: "/admin/manual-payments",
    icon: Wallet,
    title: "Pagos manuales · Yape/Plin",
    desc: "Órdenes generadas al pulsar 'Ya pagué'. Verifica el pago recibido en Yape/Plin y marca como verificada.",
    color: "text-fuchsia-500",
  },
  {
    to: "/admin/productos",
    icon: Package,
    title: "Productos digitales",
    desc: "Catálogo tipo Shopify: crea productos, precios, enlaces de Drive y upsells sin tocar código. Se sincroniza con checkout y correos.",
    color: "text-teal-600",
  },
  {
    to: "/admin/orders",
    icon: Mail,
    title: "Órdenes / Pedidos",
    desc: "Lista de pedidos con estado de entrega digital, SKUs enviados y confirmación de correo (delivered / opened / bounced).",
    color: "text-sky-600",
  },
  {
    to: "/admin/hotmart-audit",
    icon: ClipboardList,
    title: "Hotmart · Auditoría",
    desc: "Eventos recibidos de Hotmart y carritos abandonados con estado mapeado (aprobado/pendiente/rechazado/posventa) y sync a Brevo.",
    color: "text-orange-500",
  },
  {
    to: "/admin/delivery-audit",
    icon: ShieldCheck,
    title: "Auditoría · Entrega digital",
    desc: "Trazabilidad por correo: qué SKU se resolvió, qué Drive se adjuntó (o por qué faltó) para cada envío digital automático.",
    color: "text-cyan-600",
  },
  {
    to: "/admin/brevo-abandoned",
    icon: Send,
    title: "Brevo · Carritos abandonados",
    desc: "Payload real enviado a Brevo por cada carrito abandonado (tienda vs Hotmart) con ORIGEN, SEGMENTO, TAGS e IDs de producto.",
    color: "text-pink-600",
  },
  {
    to: "/admin/brevo-abandoned-stats",
    icon: LineChart,
    title: "Brevo · Dashboard abandonos",
    desc: "Tendencia diaria de abandonos Hotmart vs Tienda con filtro por COUNTRY_CODE y desglose por país.",
    color: "text-fuchsia-600",
  },
  {
    to: "/admin/analytics",
    icon: LineChart,
    title: "Analíticas · Funnel",
    desc: "Embudo estilo Shopify: sesiones, add-to-cart, checkout y compras. Conversiones, top productos por país y tendencias.",
    color: "text-violet-600",
  },
  {
    to: "/admin/ga4-compare",
    icon: GitCompare,
    title: "GA4 · Comparativa",
    desc: "Compara datos internos vs Google Analytics 4: usuarios, sesiones, eventos y fuentes de tráfico para detectar desviaciones.",
    color: "text-rose-500",
  },
];

const AdminHome = () => {
  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Panel de administración</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Todas tus herramientas internas en un solo lugar. La sesión queda activa hasta que cierres el navegador o pulses "Salir".
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {panels.map(({ to, icon: Icon, title, desc, color }) => (
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
        </div>
      </main>
    </>
  );
};

export default AdminHome;
