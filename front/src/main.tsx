import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APP_NAME } from "./costants";
import App from "./App";
import "./index.css";

document.title = APP_NAME;

const metaNames = ["application-name", "apple-mobile-web-app-title"];
metaNames.forEach((name) => {
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing) {
    existing.setAttribute("content", APP_NAME);
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  meta.setAttribute("content", APP_NAME);
  document.head.appendChild(meta);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
