import { NavLink } from "react-router-dom";
import { BarChart3, Star, Search, LayoutDashboard, LogOut, Globe, Mail, ShieldCheck, GitCompare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminKey } from "./AdminGate";

const tabs = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/admin/live", label: "En vivo", icon: Globe },
  { to: "/admin/analytics", label: "Analíticas", icon: TrendingUp },
  { to: "/admin/reviews", label: "Reseñas", icon: Star },
  
  { to: "/admin/hotmart-audit", label: "Hotmart", icon: ShieldCheck },
  { to: "/admin/ga4-compare", label: "GA4 vs Pixel", icon: GitCompare },
  { to: "/admin/seo", label: "SEO", icon: Search },
];

export const AdminNav = () => {
  const { logout } = useAdminKey();
  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1 h-12 sm:h-14 overflow-x-auto scrollbar-none">
          <span className="font-bold text-xs sm:text-sm mr-2 sm:mr-4 shrink-0">
            <span className="sm:hidden">iL·Admin</span>
            <span className="hidden sm:inline">iLingue · Admin</span>
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-1">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
