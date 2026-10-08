import path from "node:path";

// Tailwind runs for the HeroUI theme only (its CSS is the only file with Tailwind imports).
// The second plugin moves anything HeroUI/Tailwind aim at the document root onto the HeroUI theme root.
// Its path is built from the project root: Turbopack resolves a relative plugin path from its own build folder.
const scopeToThemeRoot = path.join(process.cwd(), "src/dev/isolation/heroui/scope-to-theme-root.cjs");

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [scopeToThemeRoot]: {},
  },
};

export default config;
