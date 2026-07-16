import { useEffect, useState } from "react";
import logoFallback from "@/assets/logo-ilingue-relax.webp";

const FALLBACK_SRC = logoFallback;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

const resolve = (src?: string | null) =>
  !src || src === "/placeholder.svg" || src.trim() === "" ? FALLBACK_SRC : src;

/**
 * Renders a product cover image with an automatic fallback when the
 * source is empty, points to a generic placeholder, or fails to load.
 * Updates the displayed src whenever the incoming prop changes (needed
 * for admin edits that arrive after the initial render via realtime).
 */
export const ProductCoverImage = ({ src, alt = "", ...rest }: Props) => {
  const resolved = resolve(src);
  const [current, setCurrent] = useState<string>(resolved);

  useEffect(() => {
    setCurrent(resolve(src));
  }, [src]);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== FALLBACK_SRC) setCurrent(FALLBACK_SRC);
      }}
    />
  );
};

export default ProductCoverImage;
