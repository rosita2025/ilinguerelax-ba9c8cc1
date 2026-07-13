import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorReporter } from "@/lib/errorReporter";
import { installFetchLogger } from "@/lib/fetchLogger";

installGlobalErrorReporter();
installFetchLogger();

createRoot(document.getElementById("root")!).render(<App />);

