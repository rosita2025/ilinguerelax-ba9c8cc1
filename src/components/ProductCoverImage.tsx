import { useState } from "react";
import logoFallback from "@/assets/logo-ilingue-relax.webp";

const FALLBACK_SRC = logoFallback;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

/**
 * Renders a product cover image with an automatic fallback when the
 * source is empty, points to a generic placeholder, or fails to load.
 */
export const ProductCoverImage = ({ src, alt = "", ...rest }: Props) => {
  const initial =
    !src || src === "/placeholder.svg" || src.trim() === "" ? FALLBACK_SRC : src;
  const [current, setCurrent] = useState<string>(initial);

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
