import { useEffect } from "react";

/**
 * Injects the admin PWA manifest + apple-touch-icon + theme-color when
 * the user is inside /admin. Removes them on unmount so the public site
 * keeps its own metadata. Manifest-only: no service worker.
 */
export default function AdminPWAMeta() {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const metas: HTMLMetaElement[] = [];

    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/admin-manifest.webmanifest";
    manifest.setAttribute("data-admin-pwa", "1");
    document.head.appendChild(manifest);
    links.push(manifest);

    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.setAttribute("sizes", "180x180");
    apple.href = "/admin-apple-touch.png";
    apple.setAttribute("data-admin-pwa", "1");
    document.head.appendChild(apple);
    links.push(apple);

    const appleTitle = document.createElement("meta");
    appleTitle.name = "apple-mobile-web-app-title";
    appleTitle.content = "iL Admin";
    appleTitle.setAttribute("data-admin-pwa", "1");
    document.head.appendChild(appleTitle);
    metas.push(appleTitle);

    const appleCapable = document.createElement("meta");
    appleCapable.name = "apple-mobile-web-app-capable";
    appleCapable.content = "yes";
    appleCapable.setAttribute("data-admin-pwa", "1");
    document.head.appendChild(appleCapable);
    metas.push(appleCapable);

    const appleStatus = document.createElement("meta");
    appleStatus.name = "apple-mobile-web-app-status-bar-style";
    appleStatus.content = "black-translucent";
    appleStatus.setAttribute("data-admin-pwa", "1");
    document.head.appendChild(appleStatus);
    metas.push(appleStatus);

    // Override theme-color for admin
    const originalTheme = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([data-admin-pwa])'
    );
    const originalThemeValue = originalTheme?.content;
    if (originalTheme) originalTheme.content = "#1FA69B";

    return () => {
      links.forEach((l) => l.remove());
      metas.forEach((m) => m.remove());
      if (originalTheme && originalThemeValue !== undefined) {
        originalTheme.content = originalThemeValue;
      }
    };
  }, []);

  return null;
}
