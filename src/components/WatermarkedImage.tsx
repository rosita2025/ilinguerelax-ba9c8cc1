import React from "react";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  watermarkText?: string;
  watermarkOpacity?: "low" | "medium" | "high";
}

export const WatermarkedImage = ({
  src,
  alt,
  className = "",
  watermarkText = "iLingue Relax",
  watermarkOpacity = "medium",
}: WatermarkedImageProps) => {
  const opacityClass = {
    low: "opacity-40",
    medium: "opacity-60",
    high: "opacity-80",
  }[watermarkOpacity];

  return (
    <div className="relative">
      <img src={src} alt={alt} className={className} />
      
      {/* Diagonal watermark - center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span
          className={`text-white font-bold text-xl md:text-2xl ${opacityClass} rotate-[-25deg] select-none whitespace-nowrap`}
          style={{
            textShadow: "3px 3px 6px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.6)",
            letterSpacing: "0.1em",
          }}
        >
          {watermarkText}
        </span>
      </div>

      {/* Repeated watermarks for larger images */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] rotate-[-25deg]">
          <span
            className={`text-white font-semibold text-sm md:text-base ${opacityClass} select-none whitespace-nowrap`}
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            © {watermarkText}
          </span>
        </div>
        <div className="absolute bottom-[15%] right-[10%] rotate-[-25deg]">
          <span
            className={`text-white font-semibold text-sm md:text-base ${opacityClass} select-none whitespace-nowrap`}
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            © {watermarkText}
          </span>
        </div>
      </div>

      {/* Bottom copyright bar */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-center pointer-events-none">
        <span className="text-white text-xs font-semibold opacity-80 bg-black/50 px-3 py-1 rounded-full select-none">
          © {watermarkText}
        </span>
      </div>
    </div>
  );
};
