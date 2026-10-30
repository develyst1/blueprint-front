"use client";

// The luxury gold theme root. Everything the theme draws sits inside this div:
// its CSS variables, its fonts and — through UNSAFE_PortalProvider — every HeroUI overlay
// (Popover, Drawer, Modal), which would otherwise portal to <body> and lose the variables (SPEC-B-001 rule).
import "./theme.css";
import localFont from "next/font/local";
import { createContext, useCallback, useContext, useRef, type ReactNode, type RefObject } from "react";
import { UNSAFE_PortalProvider } from "react-aria";

// Local files, so the build needs no internet (REQ-123 round 2, SPEC-122): Google's own faces, the weights below.
const serif = localFont({
  src: "./fonts/noto-serif-thai.woff2",
  weight: "500 700",
  variable: "--lg-font-serif",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/noto-sans-thai-looped.woff2",
  weight: "400 600",
  variable: "--lg-font-sans",
  display: "swap",
});

const ThemeRootContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

/** The theme root element, for code that must place something inside it by hand. */
export function useThemeRoot(): RefObject<HTMLDivElement | null> {
  const ref = useContext(ThemeRootContext);
  if (!ref) throw new Error("useThemeRoot must be used inside the luxury gold ThemeRoot");
  return ref;
}

export function ThemeRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const getContainer = useCallback(() => ref.current, []);
  return (
    <div ref={ref} data-theme-root="luxury-gold" className={`${serif.variable} ${sans.variable}`}>
      <ThemeRootContext.Provider value={ref}>
        <UNSAFE_PortalProvider getContainer={getContainer}>{children}</UNSAFE_PortalProvider>
      </ThemeRootContext.Provider>
    </div>
  );
}
