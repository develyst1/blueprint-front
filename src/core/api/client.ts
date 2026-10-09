// The only way the front end talks to blueprint-back (REQ-002 R9). Server-side only: never import this from a
// "use client" file or from src/themes/ — themes get view models, never data access.
import createClient from "openapi-fetch";
import type { paths } from "./schema";

// `||`, not `??`: an env var that is set but empty is "" and must fall back too (SYSTEM-FACTS).
export const apiBaseUrl = process.env.BLUEPRINT_API_URL || "http://127.0.0.1:4200";

export const api = createClient<paths>({ baseUrl: apiBaseUrl });
