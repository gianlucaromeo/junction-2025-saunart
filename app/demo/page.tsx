// app/demo/P5Canvas.tsx (or wherever it lives)
"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    p5?: any;
    _saunaP5?: any;
    startSaunaSketch?: () => void;
    stopSaunaSketch?: () => void;
  }
}

export default function P5Canvas() {
  // Ensure we clean up the p5 instance when leaving /demo
  useEffect(() => {
    return () => {
      if (window.stopSaunaSketch) {
        window.stopSaunaSketch();
      } else if (window._saunaP5) {
        window._saunaP5.remove();
        window._saunaP5 = undefined;
      }
    };
  }, []);

  return (
    <>
      {/* Container the sketch can attach to (your sketch can still use full-screen canvas) */}
      <div id="p5-container" />

      {/* Load p5 AFTER the page is interactive, not beforeInteractive */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/addons/p5.sound.min.js"
        strategy="afterInteractive"
      />

      {/* Load your sketch and explicitly start it when it's ready */}
      <Script
        src="/sketch.js"
        strategy="afterInteractive"
        onLoad={() => {
          // This runs when /sketch.js has been loaded (even on client-side nav to /demo)
          if (window.startSaunaSketch) {
            window.startSaunaSketch();
          } else if (window.p5 && !window._saunaP5) {
            // Fallback: if startSaunaSketch somehow isn't defined
            window._saunaP5 = new window.p5();
          }
        }}
      />
    </>
  );
}
