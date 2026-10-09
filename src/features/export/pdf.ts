// The PDF of a project's spec (SPEC-A-007 § E2, REQ-008): the local Google Chrome prints this app's own print page.
// Server-side only (the route handler). Chrome's PDF keeps real, selectable Thai text and draws the SVG diagrams as
// vectors. Nothing leaves the machine: every request Chrome makes that is not localhost / 127.0.0.1 is aborted (R6).
import { chromium, type Browser } from "playwright-core";
import { footer } from "./words";

export const PDF_TIMEOUT_MS = 60_000;
// The print page's margins (SPEC-A-007 § E1 3) — the PDF uses the same, so the footer has room.
const MARGIN = { top: "16mm", right: "14mm", bottom: "18mm", left: "14mm" };
// REQ-008 R4: page numbers on every page — the words from ./words, the two numbers filled in by Chrome's own spans.
const FOOTER = `<div style="width:100%;font-size:9px;text-align:center;color:#555">${footer('<span class="pageNumber"></span>', '<span class="totalPages"></span>')}</div>`;

/** `{project}-spec-{v<N>|draft}-{YYYY-MM-DD}.pdf` (AC-1). Characters a file system refuses, and control characters, → `-`. */
export function pdfFileName(project: string, version: number | null, date: string): string {
  // eslint-disable-next-line no-control-regex
  const safe = project.trim().replace(/[/\\:*?"<>|\u0000-\u001f\u007f]/g, "-") || "project";
  return `${safe}-spec-${version === null ? "draft" : `v${version}`}-${date}.pdf`;
}

/** The download header with the UTF-8 name (RFC 6266 `filename*`), so a Thai name survives. */
export function contentDisposition(name: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** Only this machine: http(s) to `localhost` or `127.0.0.1`, any port. Anything else is aborted while Chrome prints. */
export function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export type PdfRequests = { allowed: number; aborted: number };
export class PdfFailed extends Error {
  constructor(public readonly reason: "chrome" | "page" | "timeout") { super(`pdf failed: ${reason}`); this.name = "PdfFailed"; }
}

/** Prints `url` to an A4 PDF. Always closes Chrome. `channel` is "chrome" except in a test that forces a launch failure. */
export async function renderPdf(url: string, opts: { channel?: string; timeoutMs?: number } = {}): Promise<{ pdf: Buffer; requests: PdfRequests }> {
  const requests: PdfRequests = { allowed: 0, aborted: 0 };
  const timeoutMs = opts.timeoutMs ?? PDF_TIMEOUT_MS;
  let browser: Browser | null = null;
  const close = async () => { const b: Browser | null = browser; if (b) await b.close().catch(() => {}); };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = (async () => {
    try {
      browser = await chromium.launch({ channel: opts.channel ?? "chrome", headless: true, timeout: timeoutMs });
    } catch {
      throw new PdfFailed("chrome");
    }
    const page = await browser.newPage();
    await page.route("**/*", (route) => {
      if (isLocalUrl(route.request().url())) { requests.allowed++; return route.continue(); }
      requests.aborted++;
      return route.abort("blockedbyclient");
    });
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
    if (!res || !res.ok()) throw new PdfFailed("page");
    const pdf = await page.pdf({
      format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: FOOTER, margin: MARGIN,
    });
    return { pdf, requests };
  })();
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PdfFailed("timeout")), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
    // Close first (after a timeout this makes the still-running page work fail fast), let `work` settle, then close
    // again in case Chrome finished launching after the first close — no Chrome is ever left behind.
    await close();
    await work.catch(() => {});
    await close();
  }
}
