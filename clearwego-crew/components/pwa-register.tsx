"use client";

import { useEffect } from "react";

/** Registers the service worker for PWA install / offline readiness. */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {});
  }, []);
  return null;
}
