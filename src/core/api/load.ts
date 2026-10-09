// One wrapper around every API call: a page only ever sees data, "unreachable" or "notFound" (AC-14, AC-16).
// Server-side only, like client.ts.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; state: "unreachable" | "notFound" };

type Call<T> = Promise<{ data?: T; error?: unknown; response: Response }>;

export async function apiLoad<T>(call: Call<T>): Promise<ApiResult<T>> {
  let res: Awaited<Call<T>>;
  try {
    res = await call;
  } catch {
    return { ok: false, state: "unreachable" }; // network error: the API is down or not there
  }
  const status = res.response.status;
  if (res.response.ok && res.data !== undefined) return { ok: true, data: res.data };
  if (status >= 500) return { ok: false, state: "unreachable" };
  // 404, and 400 for an id or key the API cannot accept (a hand-typed URL): to the person reading, not found.
  return { ok: false, state: "notFound" };
}
