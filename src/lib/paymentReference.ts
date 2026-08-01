// Extracción automática del identificador de pago (comprobante / N° de
// operación) desde el texto pegado de cualquier banco o billetera:
// Interbank, BCP, BBVA, Scotiabank, Yape, Plin, SPEI/CLABE, Binance Pay, etc.
// El admin puede pegar el mensaje/voucher completo y el ID se detecta solo.

export type ReferenceMatch = {
  reference: string;
  source: string; // banco / red detectada
};

const RULES: Array<{ source: string; re: RegExp }> = [
  // Interbank / BCP / BBVA / Scotiabank / genérico en español
  { source: "Interbank", re: /interbank[\s\S]{0,120}?(?:n[°º]?\s*(?:de\s*)?opera(?:ci[oó]n|c\.?)|operaci[oó]n|referencia)\D{0,12}([A-Z0-9-]{5,25})/i },
  { source: "BCP", re: /\bbcp\b[\s\S]{0,120}?(?:operaci[oó]n|referencia)\D{0,12}([A-Z0-9-]{5,25})/i },
  { source: "BBVA", re: /bbva[\s\S]{0,120}?(?:operaci[oó]n|referencia|folio)\D{0,12}([A-Z0-9-]{5,25})/i },
  { source: "Scotiabank", re: /scotiabank[\s\S]{0,120}?(?:operaci[oó]n|referencia)\D{0,12}([A-Z0-9-]{5,25})/i },
  // SPEI México
  { source: "SPEI", re: /(?:clave\s*de\s*rastreo|rastreo)\D{0,12}([A-Z0-9]{8,30})/i },
  { source: "SPEI", re: /\bfolio\b\D{0,12}([A-Z0-9-]{5,30})/i },
  // Binance Pay: Order ID numérico largo o Transaction ID
  { source: "Binance Pay", re: /(?:order\s*id|transaction\s*id|id\s*de\s*(?:orden|transacci[oó]n))\D{0,12}([A-Z0-9]{8,32})/i },
  { source: "Binance Pay", re: /\b(\d{16,25})\b/ },
  // Yape / Plin
  { source: "Yape", re: /yape[\s\S]{0,120}?(?:c[oó]digo\s*(?:de\s*)?seguridad|operaci[oó]n|constancia)\D{0,12}([A-Z0-9-]{5,25})/i },
  { source: "Plin", re: /plin[\s\S]{0,120}?(?:operaci[oó]n|constancia|c[oó]digo)\D{0,12}([A-Z0-9-]{5,25})/i },
  // Genéricos
  { source: "Transferencia", re: /(?:n[°º]?\s*(?:de\s*)?opera(?:ci[oó]n|c\.?)|operaci[oó]n\s*(?:n[°º]?|nro\.?|num(?:ero)?\.?)?)\D{0,12}([A-Z0-9-]{5,25})/i },
  { source: "Transferencia", re: /(?:referencia|constancia|comprobante|voucher|ticket)\D{0,12}([A-Z0-9-]{5,25})/i },
];

export function extractPaymentReference(raw: string): ReferenceMatch | null {
  const text = (raw || "").trim();
  if (!text) return null;

  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (m?.[1]) {
      const ref = m[1].replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
      if (ref.length >= 5) return { reference: ref, source: rule.source };
    }
  }

  // Si el admin solo pega el número/código suelto lo tomamos tal cual.
  const bare = text.replace(/\s+/g, "");
  if (/^[A-Za-z0-9-]{5,32}$/.test(bare)) {
    return { reference: bare.toUpperCase(), source: "Manual" };
  }

  // Último recurso: el número más largo del texto.
  const nums = text.match(/\d{6,}/g);
  if (nums?.length) {
    const best = nums.sort((a, b) => b.length - a.length)[0];
    return { reference: best, source: "Detectado" };
  }
  return null;
}

export const METHOD_LABELS: Record<string, string> = {
  yape_plin: "Yape / Plin",
  binance_pay: "Binance Pay",
  clabe_mx: "SPEI / CLABE (México)",
  interbank: "Interbank (transferencia)",
  bank_transfer: "Transferencia bancaria",
};

export function methodLabel(method: string): string {
  return METHOD_LABELS[method] || (method || "").replace(/_/g, " ").toUpperCase();
}
