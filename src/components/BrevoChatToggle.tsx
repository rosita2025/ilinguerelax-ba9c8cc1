import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Routes where Brevo Conversations chat should be visible
const ALLOWED_PATHS = [
  "/",
  "/contacto",
  "/privacidad",
  "/condiciones",
  "/faq",
  "/sobre-nosotros",
  "/blog",
];

const isAllowed = (pathname: string) => {
  if (ALLOWED_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/blog/")) return true;
  return false;
};

export const BrevoChatToggle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const allowed = isAllowed(pathname);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    const apply = () => {
      if (typeof w.BrevoConversations !== "function") return false;
      try {
        w.BrevoConversations(allowed ? "show" : "hide");
      } catch (e) {
        console.warn("BrevoConversations toggle failed", e);
      }
      return true;
    };

    if (apply()) return;
    // SDK may not be ready yet — retry briefly
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (apply() || tries > 20) window.clearInterval(id);
    }, 300);
    return () => window.clearInterval(id);
  }, [pathname]);

  return null;
};
