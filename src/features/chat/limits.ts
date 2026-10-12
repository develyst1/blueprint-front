// The chat's upload limit — one source for every theme's call site and for the server action (TASK-A-060, TEST-A-005 DEF-1).
// Client-safe: no "use server", no imports. Next rejects a bigger server-action body with its English 500 page before
// `uploadAction` runs, so a page checks `isTooLarge(file)` BEFORE calling `actions.upload` and shows the `too_large` word.

/** = blueprint-back `src/http/errors.ts` MAX_UPLOAD_BYTES (decimal 20 MB, below Next's `bodySizeLimit: "20mb"` = 20 971 520). */
export const MAX_UPLOAD_BYTES = 20_000_000;

export const isTooLarge = (file: File): boolean => file.size > MAX_UPLOAD_BYTES;
