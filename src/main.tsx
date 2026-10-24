import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorReporter } from "@/lib/errorReporter";
import { installFetchLogger } from "@/lib/fetchLogger";
import { installCheckoutGate } from "@/lib/checkoutGate";
import { initMetaPixelEarly } from "@/hooks/useMetaPixel";

installGlobalErrorReporter();
installFetchLogger();
installCheckoutGate();

// Si el CSS principal se carga en segundo plano, se espera a que esté listo para no mostrar la página sin estilos.
let started = false;
const start = () => {
  if (started) return;
  started = true;
  createRoot(document.getElementById("root")!).render(<App />);
};
const cssPending = !!document.querySelector("link[data-async-css]") && !(window as unknown as { __cssReady?: number }).__cssReady;
if (cssPending) {
  window.addEventListener("ilr-css-ready", start, { once: true });
  window.setTimeout(start, 2500); // por si el CSS tarda o falla: nunca se queda en la pantalla inicial
} else {
  start();
}
initMetaPixelEarly();

