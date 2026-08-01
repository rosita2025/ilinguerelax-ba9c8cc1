// dLocal Go — validación de montos en la conciliación automática.
//
// Por qué existe:
//   Un pedido solo puede darse por pagado si el dinero acreditado en dLocal
//   coincide con lo que cobramos (p. ej. 16.65 PEN o 3.70 PEN). Si dLocal
//   informa otro monto o otra moneda (pago parcial, cupón manipulado, cambio
//   de precio en el navegador) NO se entrega el producto: se registra la
//   discrepancia para revisión manual.
//
// Reglas:
//   · Tolerancia: 1 % del monto esperado, con mínimo de 0.05 en monedas con
//     decimales y de 1 unidad en monedas sin decimales (CLP, COP, PYG…).
//   · Moneda distinta = discrepancia siempre (nunca se comparan peras con
//     manzanas).
//   · Pago MENOR al esperado = discrepancia bloqueante (no se entrega).
//   · Pago MAYOR = discrepancia informativa (sí se entrega; el cliente pagó
//     de más y se avisa en el historial).

/** Monedas que dLocal maneja sin decimales. */
const ZERO_DECIMAL = new Set(["CLP", "COP", "PYG", "VND", "JPY", "KRW", "ISK", "GNF", "IDR"]);

export type DlocalRemoteAmount = { amount: number | null; currency: string | null };

/** Extrae el monto realmente acreditado del payload de la API de dLocal. */
export function extractRemoteAmount(payment: Record<string, unknown> | null): DlocalRemoteAmount {
  if (!payment) return { amount: null, currency: null };
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
    return null;
  };
  const amount =
    num(payment.paid_amount) ??
    num(payment.amount) ??
    num((payment.order as Record<string, unknown> | undefined)?.amount) ??
    null;
  const currency =
    (typeof payment.currency === "string" && payment.currency.trim()) ||
    (typeof payment.paid_currency === "string" && payment.paid_currency.trim()) ||
    null;
  return { amount, currency: currency ? currency.toUpperCase() : null };
}

export type AmountCheck = {
  /** true cuando el monto acreditado es aceptable (igual o mayor dentro de tolerancia). */
  ok: boolean;
  /** true cuando hay diferencia relevante (de menos o de más) o cambio de moneda. */
  mismatch: boolean;
  /** true cuando el cliente pagó de MENOS: bloquea la entrega. */
  underpaid: boolean;
  expected: number | null;
  expectedCurrency: string | null;
  paid: number | null;
  paidCurrency: string | null;
  diff: number | null;
  tolerance: number;
  reason: string;
};

export function toleranceFor(expected: number, currency: string | null): number {
  const cur = (currency ?? "USD").toUpperCase();
  const floor = ZERO_DECIMAL.has(cur) ? 1 : 0.05;
  return Math.max(floor, Math.abs(expected) * 0.01);
}

/**
 * Compara lo que esperábamos cobrar contra lo que dLocal dice que se pagó.
 * Si no tenemos monto esperado registrado, no se puede validar: se acepta pero
 * se marca `reason = "sin_monto_esperado"` para que quede en el historial.
 */
export function checkAmount(
  expected: number | null | undefined,
  expectedCurrency: string | null | undefined,
  remote: DlocalRemoteAmount,
): AmountCheck {
  const exp = typeof expected === "number" && Number.isFinite(expected) ? expected : null;
  const expCur = expectedCurrency ? expectedCurrency.toUpperCase() : null;
  const paid = remote.amount;
  const paidCur = remote.currency;
  const tolerance = exp != null ? toleranceFor(exp, expCur ?? paidCur) : 0;

  if (exp == null || exp <= 0) {
    return {
      ok: true, mismatch: false, underpaid: false,
      expected: exp, expectedCurrency: expCur, paid, paidCurrency: paidCur,
      diff: null, tolerance, reason: "sin_monto_esperado",
    };
  }
  if (paid == null) {
    return {
      ok: true, mismatch: false, underpaid: false,
      expected: exp, expectedCurrency: expCur, paid: null, paidCurrency: paidCur,
      diff: null, tolerance, reason: "dlocal_sin_monto",
    };
  }
  if (expCur && paidCur && expCur !== paidCur) {
    return {
      ok: false, mismatch: true, underpaid: true,
      expected: exp, expectedCurrency: expCur, paid, paidCurrency: paidCur,
      diff: null, tolerance, reason: `moneda_distinta:${expCur}->${paidCur}`,
    };
  }

  const diff = +(paid - exp).toFixed(4);
  if (Math.abs(diff) <= tolerance) {
    return {
      ok: true, mismatch: false, underpaid: false,
      expected: exp, expectedCurrency: expCur, paid, paidCurrency: paidCur,
      diff, tolerance, reason: "coincide",
    };
  }
  const underpaid = diff < 0;
  return {
    ok: !underpaid,
    mismatch: true,
    underpaid,
    expected: exp, expectedCurrency: expCur, paid, paidCurrency: paidCur,
    diff, tolerance,
    reason: underpaid ? "pago_menor" : "pago_mayor",
  };
}

export function describeAmountCheck(c: AmountCheck): string {
  const cur = c.expectedCurrency ?? c.paidCurrency ?? "";
  if (c.reason === "coincide") return `Monto verificado: ${c.paid} ${cur} (esperado ${c.expected})`;
  if (c.reason === "sin_monto_esperado") return "No había monto registrado en el pedido: no se pudo validar el importe";
  if (c.reason === "dlocal_sin_monto") return "dLocal no devolvió el importe del pago: no se pudo validar";
  if (c.reason.startsWith("moneda_distinta")) {
    return `Discrepancia de moneda: se esperaba ${c.expected} ${c.expectedCurrency} y dLocal acreditó ${c.paid} ${c.paidCurrency}`;
  }
  if (c.underpaid) {
    return `Pago INCOMPLETO: se esperaba ${c.expected} ${cur} y dLocal acreditó ${c.paid} ${cur} (faltan ${Math.abs(c.diff ?? 0).toFixed(2)})`;
  }
  return `Pago mayor al esperado: ${c.paid} ${cur} contra ${c.expected} ${cur} (+${(c.diff ?? 0).toFixed(2)})`;
}
