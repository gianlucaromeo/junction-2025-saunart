"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    p5?: any;
    _saunaP5?: any;
    startSaunaSketch?: () => void;
    stopSaunaSketch?: () => void;
  }
}

export default function P5Canvas() {
  useEffect(() => {
    let cancelled = false;
    let p5Script: HTMLScriptElement | null = null;
    let soundScript: HTMLScriptElement | null = null;
    let sketchScript: HTMLScriptElement | null = null;

    const head = document.head || document.getElementsByTagName("head")[0];

    function loadScript(src: string): Promise<HTMLScriptElement> {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false; // preserve order
        script.onload = () => resolve(script);
        script.onerror = (e) => reject(e);
        head.appendChild(script);
      });
    }

    (async () => {
      try {
        // 1) p5 core
        p5Script = await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        );
        if (cancelled) return;

        // 2) p5.sound (needs p5 global to exist)
        soundScript = await loadScript(
          "https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/addons/p5.sound.min.js"
        );
        if (cancelled) return;

        // 3) your sketch, which assumes p5 + p5.sound are ready
        sketchScript = await loadScript("/sketch.js");
        if (cancelled) return;

        // Start the sketch once everything is guaranteed loaded
        if (window.startSaunaSketch) {
          window.startSaunaSketch();
        } else if (window.p5 && !window._saunaP5) {
          window._saunaP5 = new window.p5();
        }
      } catch (err) {
        console.error("Error loading p5 stack", err);
      }
    })();

    return () => {
      cancelled = true;

      if (window.stopSaunaSketch) {
        window.stopSaunaSketch();
      } else if (window._saunaP5) {
        window._saunaP5.remove();
        window._saunaP5 = undefined;
      }

      if (p5Script && p5Script.parentNode) p5Script.parentNode.removeChild(p5Script);
      if (soundScript && soundScript.parentNode)
        soundScript.parentNode.removeChild(soundScript);
      if (sketchScript && sketchScript.parentNode)
        sketchScript.parentNode.removeChild(sketchScript);
    };
  }, []);

  return <div id="p5-container" className="w-full h-full" />;
}
