"use client";

// The luxury gold theme root. Everything the theme draws sits inside this div:
// its CSS variables, its fonts and — through UNSAFE_PortalProvider — every HeroUI overlay
// (Popover, Drawer, Modal), which would otherwise portal to <body> and lose the variables (SPEC-B-001 rule).
import "./theme.css";
import { Noto_Sans_Thai_Looped, Noto_Serif_Thai } from "next/font/google";
import { createContext, useCallback, useContext, useRef, type ReactNode, type RefObject } from "react";
import { UNSAFE_PortalProvider } from "react-aria";

const serif = Noto_Serif_Thai({
  weight: ["500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--lg-font-serif",
  display: "swap",
});

const sans = Noto_Sans_Thai_Looped({
  weight: ["400", "500", "600"],
  subsets: ["thai", "latin"],
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
