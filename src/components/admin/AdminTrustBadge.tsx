import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { getAdmin2FASessionInfo, type Admin2FASessionInfo } from "@/lib/adminInvoke";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "expirado";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatExpiryDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

export const AdminTrustBadge = () => {
  const [info, setInfo] = useState<Admin2FASessionInfo>(() => getAdmin2FASessionInfo());

  useEffect(() => {
    const tick = () => setInfo(getAdmin2FASessionInfo());
    tick();
    const id = window.setInterval(tick, 60_000);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  if (!info.active || !info.expiresAt) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Sesión temporal
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">No hay dispositivo de confianza activo.</p>
            <p className="text-xs text-muted-foreground">Deberás ingresar OTP al reabrir.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const remainingMs = info.expiresAt - Date.now();
  const remainingLabel = formatRemaining(remainingMs);
  const expiryLabel = formatExpiryDate(info.expiresAt);
  const persistent = info.persistent;
  const nearExpiry = remainingMs < 24 * 60 * 60 * 1000;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
              persistent && !nearExpiry && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              persistent && nearExpiry && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
              !persistent && "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
            )}
          >
            {persistent ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {persistent ? "7 días activo" : "Sesión"}
            </span>
            <span>· {remainingLabel}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-medium">
            {persistent
              ? "Confiar en este dispositivo · activo"
              : "Sesión temporal (sin confianza)"}
          </p>
          <p className="text-xs text-muted-foreground">Vence: {expiryLabel}</p>
          <p className="text-xs text-muted-foreground">Restante: {remainingLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AdminTrustBadge;
