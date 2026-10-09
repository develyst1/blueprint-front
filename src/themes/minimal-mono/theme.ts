import { createTheme, type MantineColorsTuple } from "@mantine/core";
import { monoFont } from "./font";

// Option A tokens — specs/SPEC-A-002-direction/minimal-mono-direction.md § 5.
// ink #000000 · ink-2 #5C5C5C · line #8A8A8A · canvas #F2F2F2 · paper #FFFFFF · blue #0B57D0 ("needs you" only).

// Shade 9 is ink; the filled variant (primaryShade 9) is solid black with white text.
const ink: MantineColorsTuple = [
  "#F2F2F2", "#E0E0E0", "#C2C2C2", "#A3A3A3", "#8A8A8A", "#5C5C5C", "#3D3D3D", "#1F1F1F", "#0D0D0D", "#000000",
];

// Mantine draws borders and quiet fills from gray; kept neutral (no blue cast) to stay mono.
const gray: MantineColorsTuple = [
  "#FAFAFA", "#F2F2F2", "#E8E8E8", "#E0E0E0", "#C2C2C2", "#8A8A8A", "#5C5C5C", "#3D3D3D", "#1F1F1F", "#000000",
];

// The one hue: shade 6 = #0B57D0, used only for what needs a person's attention.
const needs: MantineColorsTuple = [
  "#E8F0FC", "#C6D9F7", "#9DBEF1", "#6FA0EA", "#3F80E2", "#1C68D9", "#0B57D0", "#0948AD", "#073A8B", "#052B68",
];

const family = monoFont.style.fontFamily;

export const monoTheme = createTheme({
  colors: { ink, gray, needs },
  primaryColor: "ink",
  primaryShade: 9,
  black: "#000000",
  white: "#FFFFFF",
  fontFamily: family,
  fontFamilyMonospace: "ui-monospace, Menlo, Consolas, monospace", // TASK-A-022: paths and JSON need a real fixed width
  // Nothing below 14 px (direction § 5); xs and sm are both the label size.
  fontSizes: { xs: "14px", sm: "14px", md: "16px", lg: "20px", xl: "32px" },
  lineHeights: { xs: "1.6", sm: "1.6", md: "1.6", lg: "1.4", xl: "1.25" },
  headings: {
    fontFamily: family,
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "32px", lineHeight: "1.25", fontWeight: "700" },
      h2: { fontSize: "20px", lineHeight: "1.4", fontWeight: "700" },
      h3: { fontSize: "16px", lineHeight: "1.6", fontWeight: "700" },
    },
  },
  defaultRadius: "lg",
  // No shadows anywhere in this theme.
  shadows: { xs: "none", sm: "none", md: "none", lg: "none", xl: "none" },
  // The ring itself is drawn by mono.module.css (global classes are off, so Mantine's own ring class is absent).
  focusRing: "auto",
  cursorType: "pointer",
  other: {
    canvas: "#F2F2F2",
    numeralSize: "48px",
    numeralWeight: 800,
  },
});
