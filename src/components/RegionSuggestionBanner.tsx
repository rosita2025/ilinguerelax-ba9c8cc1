import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useSubdomainRegion } from "@/hooks/useSubdomainRegion";
import {
  REGIONS,
  subdomainForCountry,
  urlForSubdomain,
} from "@/lib/subdomainRegion";

const DISMISS_KEY = "ilr_region_banner_dismissed_v1";

/**
 * Sutil banner en la parte superior que sugiere al visitante cambiar a su
 * subdominio regional (ej. desde www.ilinguerelax.com → mx.ilinguerelax.com
 * si su IP indica México). Se auto-oculta si:
 *   - Ya está en el subdominio correcto
 *   - No hay un subdominio activo para su país
 *   - Ya cerró el banner una vez (recordado 30 días vía localStorage)
 */
export const RegionSuggestionBanner = () => {
  const currentSubdomain = useSubdomainRegion();
  const { country, loading } = useRegionTier();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      const ts = parseInt(raw, 10);
      if (Number.isNaN(ts)) return false;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - ts < THIRTY_DAYS;
    } catch {
      return false;
    }
  });

  if (loading || dismissed) return null;

  const suggestedSub = subdomainForCountry(country);
  if (!suggestedSub) return null;

  // Already on the right subdomain → nothing to suggest.
  if (currentSubdomain && currentSubdomain.subdomain === suggestedSub) return null;

  const target = REGIONS[suggestedSub];
  if (!target) return null;

  // Preserve the visitor's current path when switching.
  const targetUrl =
    typeof window !== "undefined"
      ? urlForSubdomain(suggestedSub, window.location.pathname + window.location.search)
      : urlForSubdomain(suggestedSub);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const messages: Record<string, { text: string; cta: string }> = {
    es: {
      text: `¿Prefieres visitar la tienda de ${target.label}?`,
      cta: `Ir a ${target.flag} ${target.label}`,
    },
    en: {
      text: `Prefer to visit the ${target.label} store?`,
      cta: `Go to ${target.flag} ${target.label}`,
    },
    fr: {
      text: `Vous préférez visiter la boutique ${target.label}?`,
      cta: `Aller à ${target.flag} ${target.label}`,
    },
    pt: {
      text: `Prefere visitar a loja do ${target.label}?`,
      cta: `Ir para ${target.flag} ${target.label}`,
    },
  };
  const msg = messages[target.language] ?? messages.es;

  return (
    <div
      role="region"
      aria-label="Sugerencia de región"
      className="w-full bg-primary/10 border-b border-primary/20 text-foreground text-sm"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <p className="truncate">
          <span aria-hidden className="mr-2">{target.flag}</span>
          {msg.text}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={targetUrl}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {msg.cta}
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="p-1 rounded hover:bg-primary/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
