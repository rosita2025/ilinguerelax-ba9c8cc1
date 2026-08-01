import { Button } from "@/components/ui/button";

interface PinterestSaveProps {
  /** URL absoluta de la página a guardar. Por defecto, la URL actual. */
  url?: string;
  /** Imagen absoluta que se usará como pin. */
  media: string;
  /** Descripción del pin (título + gancho). */
  description: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "secondary" | "default" | "ghost";
  label?: string;
}

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.993 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.379-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.608 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

/**
 * Botón "Guardar en Pinterest" (Save Button oficial vía pinterest.com/pin/create/button).
 * No requiere el script pinit.js: evita cargar terceros y funciona en móvil y escritorio.
 */
export const PinterestSave = ({
  url,
  media,
  description,
  className,
  size = "sm",
  variant = "outline",
  label = "Guardar en Pinterest",
}: PinterestSaveProps) => {
  const handleClick = () => {
    const pageUrl =
      url || (typeof window !== "undefined" ? window.location.href : "https://ilinguerelax.com");
    const href =
      "https://www.pinterest.com/pin/create/button/" +
      `?url=${encodeURIComponent(pageUrl)}` +
      `&media=${encodeURIComponent(media)}` +
      `&description=${encodeURIComponent(description.slice(0, 480))}`;

    if (typeof window !== "undefined") {
      window.open(href, "_blank", "noopener,noreferrer,width=750,height=650");
      // Meta Pixel / analítica opcional
      (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("trackCustom", "PinterestSave", {
        content_name: description.slice(0, 100),
      });
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      aria-label={label}
      data-pin-do="none"
    >
      <PinterestIcon className="w-4 h-4 mr-2 text-[#E60023]" />
      {label}
    </Button>
  );
};

export default PinterestSave;
