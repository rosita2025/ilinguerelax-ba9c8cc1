interface WhatsAppButtonProps {
  url?: string;
  label?: string;
}

export const WhatsAppButton = ({ url, label = "¿Dudas?" }: WhatsAppButtonProps) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-28 right-4 sm:bottom-32 sm:right-6 z-[70] group"
    >
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {label}
        </span>
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl ring-2 ring-white/40 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95">
          {/* WhatsApp brand glyph, centered in a 32 viewBox */}
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="w-7 h-7 sm:w-8 sm:h-8 fill-white block"
          >
            <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.68-1.75A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.96 1.04 1.06-3.86-.25-.4A10.6 10.6 0 1 1 16 26.6zm6.09-7.94c-.33-.17-1.96-.97-2.27-1.08-.3-.11-.52-.17-.74.17-.22.33-.85 1.08-1.04 1.3-.19.22-.38.25-.71.08-.33-.17-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.33-.02-.51.15-.68.15-.15.33-.38.5-.58.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.58-.08-.17-.74-1.78-1.02-2.44-.27-.65-.55-.56-.74-.57l-.63-.01c-.22 0-.58.08-.88.41-.3.33-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.17.22 2.32 3.55 5.62 4.98.79.34 1.4.54 1.88.69.79.25 1.5.21 2.07.13.63-.09 1.96-.8 2.24-1.58.28-.78.28-1.44.19-1.58-.08-.14-.3-.22-.63-.39z" />
          </svg>
        </div>
      </div>
    </a>
  );
};
