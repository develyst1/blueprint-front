// The PDF route's pure parts (SPEC-A-007 § E2, TASK-A-046): the file name, the header, the local-only rule.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { contentDisposition, isLocalUrl, pdfFileName } from "./pdf";

describe("file name — {project}-spec-{v<N>|draft}-{YYYY-MM-DD}.pdf (AC-1)", () => {
  test("a Thai name is kept as it is", () => {
    expect(pdfFileName("จองห้องประชุม", 1, "2026-10-09")).toBe("จองห้องประชุม-spec-v1-2026-10-09.pdf");
  });
  test("never confirmed → draft; a later version → its number", () => {
    expect(pdfFileName("จองห้องประชุม", null, "2026-10-09")).toBe("จองห้องประชุม-spec-draft-2026-10-09.pdf");
    expect(pdfFileName("จองห้องประชุม", 12, "2026-12-31")).toBe("จองห้องประชุม-spec-v12-2026-12-31.pdf");
  });
  test("characters a file system refuses become -", () => {
    expect(pdfFileName('a/b\\c:d*e?f"g<h>i|j', 2, "2026-10-09")).toBe("a-b-c-d-e-f-g-h-i-j-spec-v2-2026-10-09.pdf");
    expect(pdfFileName("ชื่อ\u0000มี\u001fตัวคุม\u007f", null, "2026-10-09")).toBe("ชื่อ-มี-ตัวคุม--spec-draft-2026-10-09.pdf");
  });
  test("outer spaces trimmed; a name that is all spaces still gives a file name", () => {
    expect(pdfFileName("  จองห้อง  ", 1, "2026-10-09")).toBe("จองห้อง-spec-v1-2026-10-09.pdf");
    expect(pdfFileName("   ", 1, "2026-10-09")).toBe("project-spec-v1-2026-10-09.pdf");
  });
});

test("Content-Disposition carries the UTF-8 name (filename*=UTF-8'')", () => {
  expect(contentDisposition("จองห้อง-spec-v1-2026-10-09.pdf"))
    .toBe(`attachment; filename*=UTF-8''${encodeURIComponent("จองห้อง-spec-v1-2026-10-09.pdf")}`);
});

test("only this machine is allowed while Chrome prints (R6, AC-5)", () => {
  for (const u of ["http://localhost:3210/p/x/export/print", "http://127.0.0.1:4211/v1/projects", "http://localhost:3210/_next/static/a.js"]) {
    expect([u, isLocalUrl(u)]).toEqual([u, true]);
  }
  for (const u of ["https://fonts.googleapis.com/css2?family=Sarabun", "http://example.com/a.png", "https://localhost.evil.com/", "http://127.0.0.2/x",
    "http://[::1]:3210/", "ws://localhost:3210/", "file:///etc/hosts", "not a url"]) {
    expect([u, isLocalUrl(u)]).toEqual([u, false]);
  }
});

// TASK-A-062: two print rules a visual fix depends on (TEST-A-006 DEF-1, DEF-2). Computed in Chrome by
// ai-worker/tests/harness/export/measure.mjs (web svg 509.3 mm → 181.5 mm); here the rules themselves must not be lost.
describe("print.module.css keeps the two A-062 fixes", () => {
  const css = readFileSync(new URL("./print.module.css", import.meta.url), "utf8");
  const block = (selector: string) => {
    const i = css.indexOf(`${selector} {`);
    return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
  };

  test("a diagram on a fixed-size canvas is shrunk to the sheet with it (inline size needs !important)", () => {
    const b = block('.sheet [data-print="expand"] > div:has(> svg)');
    expect(b).toContain("width: 100% !important");
    expect(b).toContain("height: auto !important");
  });

  test("the cover list leaves room for a three-digit marker (em, not a fixed 22px)", () => {
    const b = block(".stuck ol");
    expect(b).toMatch(/padding-left:\s*3\.5em/);
    expect(b).not.toContain("22px");
  });
});
