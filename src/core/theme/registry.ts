import type { Theme } from "./contract";
import { defaultTheme } from "./default";
import { themes } from "./registry.generated";

// The theme a project asked for, or the default one when its id is unknown (SPEC-B-001: unknown Project.theme → default).
export function getTheme(id: string): Theme {
  return themes[id] ?? defaultTheme;
}

// Every registered theme, then the default last — the order the theme picker shows them.
export function listThemes(): Theme[] {
  return [...Object.values(themes), defaultTheme];
}
