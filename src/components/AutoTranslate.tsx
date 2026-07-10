import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nContext";

/**
 * Sitewide automatic translation via Google Website Translator.
 * Source language is Spanish (site's native language). Target language
 * is whatever useI18n detected from the visitor's IP (en, pt, fr, es).
 *
 * We set the `googtrans` cookie BEFORE the widget initializes so the
 * page loads already translated — no visible flash of the language
 * picker. The widget UI itself is hidden with CSS (see index.css).
 */

const SOURCE_LANG = "es";
// Google Translate uses these codes (matches our i18n Language type)
const SUPPORTED: Record<string, string> = {
  es: "es",
  en: "en",
  pt: "pt",
  fr: "fr",
};

function setGoogTransCookie(target: string) {
  const value = `/${SOURCE_LANG}/${target}`;
  // Set on current host AND on the root domain so it survives www/apex
  const host = window.location.hostname;
  const parts = host.split(".");
  const rootDomain = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `googtrans=${value}; path=/; expires=${expires}`;
  document.cookie = `googtrans=${value}; path=/; domain=${rootDomain}; expires=${expires}`;
}

function clearGoogTransCookie() {
  const host = window.location.hostname;
  const parts = host.split(".");
  const rootDomain = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
  document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

let widgetLoaded = false;

function loadWidget() {
  if (widgetLoaded) return;
  widgetLoaded = true;

  // Container the widget mounts into
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }

  (window as any).googleTranslateElementInit = () => {
    const g = (window as any).google;
    if (!g?.translate?.TranslateElement) return;
    new g.translate.TranslateElement(
      {
        pageLanguage: SOURCE_LANG,
        includedLanguages: "en,es,pt,fr",
        autoDisplay: false,
        layout: g.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function AutoTranslate() {
  const { language } = useI18n();

  useEffect(() => {
    const target = SUPPORTED[language] || "es";

    if (target === SOURCE_LANG) {
      // Native language — remove any prior translation cookie and reload
      // only if the page was previously translated.
      const cookie = document.cookie.split("; ").find((c) => c.startsWith("googtrans="));
      if (cookie && cookie !== `googtrans=/${SOURCE_LANG}/${SOURCE_LANG}`) {
        clearGoogTransCookie();
        window.location.reload();
      }
      return;
    }

    const desired = `/${SOURCE_LANG}/${target}`;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith("googtrans="))
      ?.split("=")[1];

    if (current !== desired) {
      setGoogTransCookie(target);
      // If widget already loaded, we need a reload to re-translate cleanly
      if (widgetLoaded) {
        window.location.reload();
        return;
      }
    }

    loadWidget();
  }, [language]);

  return null;
}

export default AutoTranslate;
