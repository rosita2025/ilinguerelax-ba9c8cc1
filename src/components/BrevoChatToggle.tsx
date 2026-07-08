import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Routes where Brevo Conversations chat should load & show
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

const BREVO_ID = "6a4c61c1b64ae5bceb0b63b5";
let brevoLoaded = false;

const loadBrevo = () => {
  if (brevoLoaded) return;
  brevoLoaded = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.BrevoConversationsID = BREVO_ID;
  w.BrevoConversations =
    w.BrevoConversations ||
    function () {
      (w.BrevoConversations.q = w.BrevoConversations.q || []).push(arguments);
    };
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://conversations-widget.brevo.com/brevo-conversations.js";
  document.head.appendChild(s);
};

export const BrevoChatToggle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const allowed = isAllowed(pathname);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    if (!allowed) {
      // If Brevo already loaded on a previous page, hide it here
      if (typeof w.BrevoConversations === "function") {
        try {
          w.BrevoConversations("hide");
        } catch (e) {
          console.warn("BrevoConversations hide failed", e);
        }
      }
      return;
    }

    // Allowed route → make sure it's loaded, then show
    loadBrevo();

    const show = () => {
      if (typeof w.BrevoConversations !== "function") return false;
      try {
        w.BrevoConversations("show");
      } catch (e) {
        console.warn("BrevoConversations show failed", e);
      }
      return true;
    };

    if (show()) return;
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (show() || tries > 20) window.clearInterval(id);
    }, 300);
    return () => window.clearInterval(id);
  }, [pathname]);

  return null;
};
