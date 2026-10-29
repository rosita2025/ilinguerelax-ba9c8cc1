export type PatronesConnection = { saveData?: boolean; effectiveType?: string; downlink?: number };

/** Optional browser hints: unknown networks retain normal quality. */
export function isPatronesConstrainedConnection(connection?: PatronesConnection): boolean {
  return Boolean(connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "") ||
    (typeof connection?.downlink === "number" && connection.downlink > 0 && connection.downlink <= 1.5));
}

export function getPatronesConnection(): PatronesConnection | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: PatronesConnection }).connection;
}