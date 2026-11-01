// Países donde la tarjeta NO se guarda para cobros futuros (Europa y LATAM): los bancos de esas
// regiones rechazan más los pagos que piden guardar la tarjeta (setup_future_usage). Aquí el pago
// se hace como compra normal y el upsell posterior de 1 clic no se ofrece.
// Mantener igual en src/lib/cardSaving.ts y supabase/functions/_shared/cardSaving.ts.
const NO_SAVED_CARD_COUNTRIES = new Set([
  // Europa
  "AL","AD","AT","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GR","HR","HU","IE","IS","IT","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","SE","SI","SK","SM","UA","VA","XK",
  // LATAM
  "AR","BO","BR","CL","CO","CR","DO","EC","SV","GT","HN","MX","NI","PA","PY","PE","UY","VE",
]);

export function savesCardForFutureUse(country: string | null | undefined): boolean {
  return !NO_SAVED_CARD_COUNTRIES.has((country || "").toUpperCase().slice(0, 2));
}
