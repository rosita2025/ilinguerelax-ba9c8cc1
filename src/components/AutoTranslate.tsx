import { useEffect } from "react";

function clearGoogTransCookie() {
  const host = window.location.hostname;
  const parts = host.split(".");
  const rootDomain = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
  document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function AutoTranslate() {
  useEffect(() => {
    // The Google Website Translator mutates text nodes outside React.
    // On product pages this can trigger React's removeChild NotFoundError and
    // leave the storefront blank, especially after geolocation/language rerenders.
    // Keep the app stable by removing legacy translate cookies and relying on
    // the built-in i18n/country selectors instead of injecting the widget.
    if (document.cookie.includes("googtrans=")) clearGoogTransCookie();
    document.getElementById("google_translate_element")?.remove();
    delete (window as { googleTranslateElementInit?: unknown }).googleTranslateElementInit;
  }, []);

  return null;
}

export default AutoTranslate;
