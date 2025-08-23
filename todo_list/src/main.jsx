import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register service worker for basic PWA support (only in production)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // use a root-relative path; our sw.js is placed in /public
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // registration successful
        console.log(
          "ServiceWorker registration successful with scope: ",
          reg.scope
        );
      })
      .catch((err) => {
        console.warn("ServiceWorker registration failed: ", err);
      });
  });
}
