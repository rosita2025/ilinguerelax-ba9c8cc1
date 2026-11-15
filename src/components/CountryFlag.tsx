import { useState } from "react";

/** Bandera como emoji (solo si la imagen no carga). */
const emojiFlag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + 127397));

/**
 * Bandera del país como IMAGEN (public/flags/xx.svg, del paquete country-flag-icons, MIT).
 * Los emojis de bandera NO se ven en Windows (salen como «PE»), por eso no se usan como principal.
 */
export const CountryFlag = ({ code, className = "", label }: { code: string; className?: string; label?: string }) => {
  const [failed, setFailed] = useState(false);
  const cc = (code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  if (failed) {
    return <span role="img" aria-label={label ?? cc} className={`leading-none ${className}`}>{emojiFlag(cc)}</span>;
  }
  return (
    <img
      src={`/flags/${cc.toLowerCase()}.svg`}
      alt={label ?? cc}
      width={24}
      height={16}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`inline-block h-4 w-6 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10 ${className}`}
    />
  );
};

export default CountryFlag;
