// Who is writing (REQ-103, SPEC-104 D4): the name the person typed on the site, kept in the `bp_by` cookie and sent to
// blueprint-back as `X-Blueprint-By` (percent-encoded: a Thai name is not a valid raw header value). Server-side only.
// Not a login — the name is typed, not verified.
import { cookies } from "next/headers";

import { BY_COOKIE, BY_MAX } from "@/core/name/cookie";

export const BY_HEADER = "X-Blueprint-By";

/** The name in the cookie, or null when there is none or it is not usable (empty, over 100 characters). */
export async function readBy(): Promise<string | null> {
  const value = (await cookies()).get(BY_COOKIE)?.value;
  return cleanBy(value);
}

/** Pure: the cookie's text → a name or null. Next hands the value over already percent-decoded; a value that is
 *  still encoded is decoded once (a name with a lone `%` stays as it is). */
export function cleanBy(value: string | null | undefined): string | null {
  if (!value) return null;
  let name = value;
  if (/%[0-9A-Fa-f]{2}/.test(name)) {
    try { name = decodeURIComponent(name); } catch { /* keep as is */ }
  }
  name = name.trim();
  return name && name.length <= BY_MAX && !name.includes("\0") ? name : null;
}

/** The header every write carries. */
export const byHeader = (name: string): Record<string, string> => ({ [BY_HEADER]: encodeURIComponent(name) });
