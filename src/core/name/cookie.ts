// The name cookie's constants and writer — client-safe (by.ts, which reads it on the server, imports next/headers).
export const BY_COOKIE = "bp_by";
/** What the back end accepts (SPEC-104 § Who). */
export const BY_MAX = 100;
const YEAR = 60 * 60 * 24 * 365;

/** The cookie text for a name — percent-encoded, path `/`, one year. */
export const byCookie = (name: string): string => `${BY_COOKIE}=${encodeURIComponent(name)}; path=/; max-age=${YEAR}; samesite=lax`;
