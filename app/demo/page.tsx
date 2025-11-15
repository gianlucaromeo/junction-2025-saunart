"use client";

import Script from "next/script";

export default function P5Canvas() {
  return (
    <>
      {/* Optional container if your sketch uses a specific parent */}
      <div id="p5-container" />

      {/* Load p5 from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        strategy="beforeInteractive"
      />

      <Script
        src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/addons/p5.sound.min.js"
        strategy="beforeInteractive"
      />

      {/* Load your existing sketch.js (served from /public) */}
      <Script src="/sketch.js" strategy="beforeInteractive" />
    </>
  );
}
