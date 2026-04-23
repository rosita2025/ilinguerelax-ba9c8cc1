import { useEffect } from "react";

const AMAZON_DESTINATION = "https://amzn.to/48TwMMv";

/**
 * Intermediate redirect page for Google Analytics tracking.
 * GA registers the page_view of /amazon and the click_amazon event,
 * then the browser is redirected to the Amazon affiliate link.
 */
const AmazonRedirect = () => {
  useEffect(() => {
    // Fire GA event if gtag is available
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", "click_amazon", {
        event_category: "outbound",
        event_label: AMAZON_DESTINATION,
        transport_type: "beacon",
      });
    }
    // Small delay to give analytics time to fire, then redirect
    const t = setTimeout(() => {
      window.location.replace(AMAZON_DESTINATION);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Redirigiendo a Amazon…
        </h1>
        <p className="text-muted-foreground">
          Si no eres redirigido automáticamente,{" "}
          <a
            href={AMAZON_DESTINATION}
            className="text-primary underline font-semibold"
          >
            haz clic aquí
          </a>
          .
        </p>
      </div>
    </main>
  );
};

export default AmazonRedirect;