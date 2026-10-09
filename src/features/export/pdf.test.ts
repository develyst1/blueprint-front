// The PDF route's pure parts (SPEC-A-007 § E2, TASK-A-046): the file name, the header, the local-only rule.
import { describe, expect, test } from "bun:test";
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
