/**
 * Insignias de tarjetas dibujadas en SVG dentro del propio código: no dependen de
 * imágenes externas (antes salían rotas si el archivo no cargaba).
 */
const box = "inline-flex items-center justify-center h-5 w-9 sm:h-4 sm:w-7 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 overflow-hidden";

export function VisaBadge() {
  return (
    <span className={`${box} bg-white`} role="img" aria-label="Visa">
      <svg viewBox="0 0 32 12" className="w-[80%] h-auto" aria-hidden="true">
        <text x="16" y="10" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="12" fill="#1A1F71">VISA</text>
      </svg>
    </span>
  );
}

export function MastercardBadge() {
  return (
    <span className={`${box} bg-white`} role="img" aria-label="Mastercard">
      <svg viewBox="0 0 24 16" className="w-[70%] h-auto" aria-hidden="true">
        <circle cx="9" cy="8" r="6" fill="#EB001B" />
        <circle cx="15" cy="8" r="6" fill="#F79E1B" />
        <path d="M12 3.6a6 6 0 0 1 0 8.8 6 6 0 0 1 0-8.8z" fill="#FF5F00" />
      </svg>
    </span>
  );
}

export function AmexBadge() {
  return (
    <span className={`${box}`} style={{ background: "#2E77BC" }} role="img" aria-label="American Express">
      <svg viewBox="0 0 32 12" className="w-[80%] h-auto" aria-hidden="true">
        <text x="16" y="9.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="9" fill="#ffffff">AMEX</text>
      </svg>
    </span>
  );
}

export function ApplePayBadge() {
  return (
    <span className={`${box} bg-black`} role="img" aria-label="Apple Pay">
      <svg viewBox="0 0 32 12" className="w-[85%] h-auto" aria-hidden="true">
        <text x="16" y="9" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="5.8" fill="#ffffff">Apple Pay</text>
      </svg>
    </span>
  );
}

export function PayPalBadge() {
  return (
    <span className={`${box} bg-white`} role="img" aria-label="PayPal">
      <svg viewBox="0 0 32 12" className="w-[85%] h-auto" aria-hidden="true">
        <text x="16" y="9.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="8.5">
          <tspan fill="#003087">Pay</tspan><tspan fill="#009CDE">Pal</tspan>
        </text>
      </svg>
    </span>
  );
}
