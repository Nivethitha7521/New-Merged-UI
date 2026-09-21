

// newrecipe/hooks/useIsAndroid.ts
import { useEffect, useState } from "react";

// Minimal shape of the global Capacitor object injected by Capacitor apps.
// Only the piece we actually use (getPlatform) is declared.
interface CapacitorGlobal {
  getPlatform?: () => string;
}

// Extend the Window type locally instead of casting to `any`.
interface WindowWithCapacitor extends Window {
  Capacitor?: CapacitorGlobal;
}

/**
 * Detects whether the app is running inside the Android build
 * (Capacitor/Cordova WebView, or a plain Android Chrome browser).
 *
 * Returns `false` on first render (SSR-safe) and updates once the
 * component mounts and `window`/`navigator` are available.
 *
 * If you convert this app with Capacitor, `window.Capacitor` will exist
 * and `getPlatform()` will return "android" — that's the most reliable
 * signal. The userAgent check is a fallback for a plain mobile browser.
 */
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 1. Capacitor/Cordova wrapped app — most reliable signal
    const capacitor = (window as WindowWithCapacitor).Capacitor;
    if (capacitor?.getPlatform) {
      setIsAndroid(capacitor.getPlatform() === "android");
      return;
    }

    // 2. Fallback: plain Android browser userAgent sniff
    const ua = navigator.userAgent || "";
    setIsAndroid(/Android/i.test(ua));
  }, []);

  return isAndroid;
}