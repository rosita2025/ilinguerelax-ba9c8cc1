import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BarChart3, Star, Search, ArrowRight } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";

const panels = [
  {
    to: "/admin/reviews",
    icon: Star,
    title: "Reseñas",
    desc: "Modera reseñas enviadas: aprueba, rechaza y responde. Se muestran públicamente al aprobarlas.",
    color: "text-amber-500",
  },
  {
    to: "/admin/funnel",
    icon: BarChart3,
    title: "Funnel",
    desc: "Vistas, leads, add-to-cart, checkouts y compras. Segmentado por producto, país y fuente.",
    color: "text-primary",
  },
  {
    to: "/admin/seo",
    icon: Search,
    title: "SEO · Google",
    desc: "Top queries y landing pages desde Google Search Console. Clics, impresiones, CTR y posición.",
    color: "text-emerald-500",
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
