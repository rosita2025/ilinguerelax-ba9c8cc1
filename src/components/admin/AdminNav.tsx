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
  ClipboardList,
  Send,
  LineChart,
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
import AdminPWAMeta from "./AdminPWAMeta";

type Group = { label: string; items: Array<{ to: string; label: string; icon: any }> };

const groups: Group[] = [
  {
    label: "General",
    items: [
      { to: "/admin", label: "Inicio", icon: LayoutDashboard },
      { to: "/admin/live", label: "Visitas en vivo", icon: Globe },
    ],
  },
  {
    label: "Ventas",
    items: [
      { to: "/admin/purchases-status", label: "Pagos · Estado", icon: CreditCard },
      { to: "/admin/checkout-methods", label: "Métodos Stripe", icon: CreditCard },
      { to: "/admin/manual-payments", label: "Pagos manuales", icon: Wallet },
      { to: "/admin/binance-config", label: "Binance Pay", icon: Wallet },
      { to: "/admin/orders", label: "Órdenes / Pedidos", icon: Mail },
      { to: "/admin/hotmart-audit", label: "Hotmart · Auditoría", icon: ShieldCheck },
    ],
  },
  {
    label: "Productos",
    items: [
      { to: "/admin/productos", label: "Productos digitales", icon: Package },
      { to: "/admin/delivery-audit", label: "Entrega digital", icon: ShieldCheck },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/reviews", label: "Reseñas", icon: Star },
      { to: "/admin/brevo-abandoned", label: "Brevo · Abandonos", icon: Send },
      { to: "/admin/brevo-abandoned-stats", label: "Brevo · Dashboard", icon: LineChart },
    ],
  },
  {
    label: "Analítica",
    items: [
      { to: "/admin/analytics", label: "Funnel", icon: TrendingUp },
      { to: "/admin/ga4-compare", label: "GA4 vs Pixel", icon: GitCompare },
      { to: "/admin/seo", label: "SEO · Google", icon: Search },
    ],
  },
  {
    label: "Seguridad",
    items: [
      { to: "/admin/checkout-abuse", label: "Anti-abuso Checkout", icon: Shield },
    ],
  },
];

const flat = groups.flatMap((g) => g.items);

export const AdminNav = () => {
  const { logout } = useAdminKey();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = flat.find((t) => t.to === pathname) ?? flat[0];
  const CurrentIcon = current.icon;

  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 h-12 sm:h-14">
          <NavLink to="/admin" end className="font-bold text-xs sm:text-sm shrink-0">
            <span className="sm:hidden">iL·Admin</span>
            <span className="hidden sm:inline">iLingue · Admin</span>
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 ml-auto sm:ml-2">
                <Menu className="w-4 h-4" />
                <CurrentIcon className="w-4 h-4 hidden sm:inline" />
                <span className="truncate max-w-[160px] sm:max-w-none">{current.label}</span>
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
              <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
