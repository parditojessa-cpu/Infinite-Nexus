import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/chartSetup";
import { App } from "./app/App";
import { registerServiceWorker } from "./lib/registerServiceWorker";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker();
