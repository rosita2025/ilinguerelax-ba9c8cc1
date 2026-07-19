import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * On admin.ilinguerelax.com:
 *  - Redirect root "/" → "/admin" so Chrome sees the admin app
 *  - Inject PWA manifest + apple-touch-icon so "Install app" offers the Admin
 *  - Inject <meta robots="noindex,nofollow"> so Google does NOT index this
 *    subdomain (protects SEO of the main ilinguerelax.com).
 */
export default function AdminSubdomainGate() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminHost =
    typeof window !== "undefined" &&
    /^admin\./i.test(window.location.hostname);

  useEffect(() => {
    if (!isAdminHost) return;
    if (location.pathname === "/" || location.pathname === "") {
      navigate("/admin", { replace: true });
    }
  }, [isAdminHost, location.pathname, navigate]);

  useEffect(() => {
    if (!isAdminHost) return;

    const injected: Element[] = [];

    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      el.setAttribute("data-admin-host", "1");
      document.head.appendChild(el);
      injected.push(el);
    };

    add("link", { rel: "manifest", href: "/admin-manifest.webmanifest" });
    add("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/admin-apple-touch.png" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "apple-mobile-web-app-title", content: "iL Admin" });
    add("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" });
    add("meta", { name: "robots", content: "noindex,nofollow" });
    add("meta", { name: "googlebot", content: "noindex,nofollow" });

    // Neutralize any existing canonical that points at the main domain
    const existingCanonicals = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]:not([data-admin-host])')
    );
    existingCanonicals.forEach((l) => {
      l.setAttribute("data-admin-host-hidden", l.getAttribute("href") || "");
      l.remove();
    });

    return () => {
      injected.forEach((el) => el.remove());
      existingCanonicals.forEach((l) => {
        l.removeAttribute("data-admin-host-hidden");
        document.head.appendChild(l);
      });
    };
  }, [isAdminHost]);

  return null;
}
