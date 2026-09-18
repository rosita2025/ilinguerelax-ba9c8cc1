import { ExternalLink, X } from "lucide-react";
import { useState } from "react";

function isMetaInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|FBSV|FBMD|Instagram/i.test(ua);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function InAppBrowserBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isMetaInAppBrowser()) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const androidIntentUrl = `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
      <div className="flex items-start gap-3">
        <ExternalLink className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Para pagar sin problemas, abre este enlace en tu navegador
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Detectamos que estás navegando dentro de la app de Facebook/Instagram. Algunos pagos pueden fallar aquí.
          </p>
          {isAndroid() ? (
            <a
              href={androidIntentUrl}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir en Chrome
            </a>
          ) : (
            <p className="mt-3 text-sm font-medium text-amber-800">
              Toca el ícono ··· o compartir arriba a la derecha y elige{" "}
              <span className="font-bold">"Abrir en Safari"</span>.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-700 hover:text-amber-900"
          aria-label="Cerrar aviso"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
