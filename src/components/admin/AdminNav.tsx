import { NavLink } from "react-router-dom";
import { BarChart3, Star, Search, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/admin/reviews", label: "Reseñas", icon: Star },
  { to: "/admin/funnel", label: "Funnel", icon: BarChart3 },
  { to: "/admin/seo", label: "SEO", icon: Search },
];

export const AdminNav = () => {
  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 h-14 overflow-x-auto">
          <span className="font-bold text-sm mr-4 shrink-0">iLingue · Admin</span>
          <div className="flex items-center gap-1">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
