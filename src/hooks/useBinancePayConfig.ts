import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BinancePayConfig {
  region_code: string;
  address: string;
  holder_name: string;
  qr_url: string;
  network: string;
  pay_id: string;
  active: boolean;
}

const FALLBACK: BinancePayConfig = {
  region_code: "DEFAULT",
  address: "TPAwV7vFhuoYbwzEzmDuN229DwFUBCKH TF",
  holder_name: "iLingue Relax",
  qr_url: "https://cdn.phototourl.com/free/2026-07-17-19c64084-faa9-41f1-a1cb-5010d297c0be.jpg",
  network: "Binance Pay (Pay ID)",
  pay_id: "389090038",
  active: true,
};

let cache: BinancePayConfig[] | null = null;
let cacheAt = 0;
const TTL_MS = 30_000;

async function loadAll(): Promise<BinancePayConfig[]> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const { data, error } = await supabase
    .from("binance_pay_configs")
    .select("region_code,address,holder_name,qr_url,network,pay_id,active")
    .eq("active", true);
  if (error || !data) return cache ?? [FALLBACK];
  cache = data as BinancePayConfig[];
  cacheAt = Date.now();
  return cache;
}

export function invalidateBinanceConfigCache() {
  cache = null;
  cacheAt = 0;
}

/**
 * Devuelve la configuración de Binance Pay para el `regionCode` dado. Si no
 * hay una fila específica para esa región usa `DEFAULT`; si tampoco hay
 * `DEFAULT` cae a los valores hard-coded originales.
 */
export function useBinancePayConfig(regionCode: string | null): BinancePayConfig {
  const [cfg, setCfg] = useState<BinancePayConfig>(FALLBACK);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await loadAll();
      const target = (regionCode || "").toUpperCase();
      const match =
        rows.find((r) => r.region_code.toUpperCase() === target) ||
        rows.find((r) => r.region_code.toUpperCase() === "DEFAULT") ||
        FALLBACK;
      if (alive) setCfg(match);
    })();
    return () => { alive = false; };
  }, [regionCode]);

  return cfg;
}
