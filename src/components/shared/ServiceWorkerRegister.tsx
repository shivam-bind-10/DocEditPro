"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("DocEditPro Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("DocEditPro Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
