"use client";

// The clean-blue root: data-theme-root, its own Ant ConfigProvider and its font — nothing on html/body.
// Ant overlays (Select, Popover, Modal, Drawer, Tooltip) portal into this element via getPopupContainer, so they keep
// this theme's tokens (SPEC-B-001 "Overlays must portal into the theme's own root").
import { ConfigProvider } from "antd";
import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { cleanBlueFont } from "./font";
import { antTheme, color, group, radius } from "./tokens";
import s from "./clean-blue.module.css";

const theme = antTheme(cleanBlueFont.style.fontFamily);

// tokens.ts → CSS variables on this root only, so the CSS modules never repeat a colour.
const vars = {
  ...Object.fromEntries(Object.entries(color).map(([k, v]) => [`--cb-${k}`, v])),
  ...Object.fromEntries(Object.entries(group).flatMap(([k, v]) => [[`--cb-${k}`, v.fg], [`--cb-${k}-soft`, v.bg]])),
  "--cb-r-card": `${radius.card}px`,
  "--cb-r-tile": `${radius.tile}px`,
} as CSSProperties;

export function Root({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const container = useCallback(() => ref.current ?? document.body, []);
  return (
    <div ref={ref} data-theme-root="clean-blue" className={`${s.root} ${cleanBlueFont.className}`} style={vars}>
      <ConfigProvider theme={theme} getPopupContainer={container} getTargetContainer={container}>
        {children}
      </ConfigProvider>
    </div>
  );
}
