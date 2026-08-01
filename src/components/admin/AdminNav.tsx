import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Star,
  Search,
  LayoutDashboard,
  LogOut,
  Globe,
  ShieldCheck,
  GitCompare,
  TrendingUp,
  CreditCard,
  Wallet,
  Shield,
  Menu,
  Package,
  Mail,
  Send,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminKey } from "./AdminGate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users } from "lucide-react";
import AdminPWAMeta from "./AdminPWAMeta";
import AdminTrustBadge from "./AdminTrustBadge";

type Group = { label: string; items: Array<{ to: string; label: string; icon: any }> };

const groups: Group[] = [
  {
    label: "General",
    items: [
      { to: "/admin", label: "Inicio", icon: LayoutDashboard },
      { to: "/admin/live", label: "Visitas en vivo · Hoy", icon: Globe },
      { to: "/admin/audiencias", label: "Audiencias · Total único", icon: Users },
    ],
  },
  {
    label: "Ventas",
    items: [
      { to: "/admin/orders", label: "Órdenes / Pedidos", icon: Mail },
      { to: "/admin/purchases-status", label: "Pagos · Estado", icon: CreditCard },
      { to: "/admin/checkout-methods", label: "Métodos de pago Stripe", icon: CreditCard },
      { to: "/admin/manual-payments", label: "Pagos manuales", icon: Wallet },
      { to: "/admin/binance-config", label: "Binance Pay", icon: Wallet },
      { to: "/admin/dlocal", label: "dLocal Go · Cobertura", icon: Globe },
      { to: "/admin/hotmart-audit", label: "Hotmart · Auditoría", icon: ShieldCheck },
    ],
  },
  {
    label: "Productos",
    items: [
      { to: "/admin/productos", label: "Productos digitales", icon: Package },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/reviews", label: "Reseñas", icon: Star },
      { to: "/admin/lanzamientos", label: "Lanzamientos · Anuncio", icon: Send },
      { to: "/admin/brevo-abandoned", label: "Brevo · Abandonos", icon: Send },
    ],
  },
  {
    label: "Analítica",
    items: [
      { to: "/admin/analytics", label: "Funnel", icon: TrendingUp },
      { to: "/admin/ga4-compare", label: "GA4 vs Pixel", icon: GitCompare },
      { to: "/admin/seo", label: "SEO · Google", icon: Search },
      { to: "/admin/indexing", label: "Indexación · Estado", icon: Globe },
    ],
  },
  {
    label: "Seguridad",
    items: [
      { to: "/admin/checkout-abuse", label: "Anti-abuso Checkout", icon: Shield },
      { to: "/admin/payment-errors", label: "Fallos de pago", icon: AlertTriangle },
      { to: "/admin/email-rules", label: "Correos · Lista negra/blanca", icon: Mail },
    ],
  },
];

const flat = groups.flatMap((g) => g.items);

const SIDEBAR_STYLE_ID = "admin-sidebar-offset";

export const AdminNav = () => {
  const { logout } = useAdminKey();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = flat.find((t) => t.to === pathname) ?? flat[0];
  const CurrentIcon = current.icon;

  // Desplaza el contenido del panel para dejar espacio a la barra lateral fija
  // (solo en escritorio). Se limpia al desmontar el panel admin.
  useEffect(() => {
    const style = document.createElement("style");
    style.id = SIDEBAR_STYLE_ID;
    style.textContent =
      "@media (min-width: 1024px){ body { padding-left: 16rem; } }";
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return (
    <>
      <AdminPWAMeta />

      {/* Barra lateral fija (escritorio) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-card">
        <div className="h-14 flex items-center px-4 border-b">
          <NavLink to="/admin" end className="font-bold text-sm">
            iLingue · Admin
          </NavLink>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          {groups.map((g) => (
            <div key={g.label} className="px-3 pb-3">
              <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              <div className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/admin"}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname === to
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Barra superior */}
      <nav className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 h-12 sm:h-14">
            <NavLink to="/admin" end className="font-bold text-xs sm:text-sm shrink-0 lg:hidden">
              <span className="sm:hidden">iL·Admin</span>
              <span className="hidden sm:inline">iLingue · Admin</span>
            </NavLink>
            <span className="hidden lg:flex items-center gap-2 text-sm font-medium">
              <CurrentIcon className="w-4 h-4 text-primary" />
              {current.label}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <AdminTrustBadge />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                    <Menu className="w-4 h-4" />
                    <span className="truncate max-w-[160px]">{current.label}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
                  {groups.map((g, gi) => (
                    <div key={g.label}>
                      {gi > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {g.label}
                      </DropdownMenuLabel>
                      {g.items.map(({ to, label, icon: Icon }) => (
                        <DropdownMenuItem
                          key={to}
                          onClick={() => navigate(to)}
                          className={cn(
                            "gap-2 cursor-pointer",
                            pathname === to && "bg-primary/10 text-primary font-medium",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={logout}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cerrar sesión del panel admin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tendrás que ingresar tu clave y el código 2FA de nuevo la próxima vez que abras la app.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default AdminNav;
