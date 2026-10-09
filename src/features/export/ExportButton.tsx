"use client";

// ส่งออก PDF (REQ-008 R1, R7; SPEC-A-007 § E2 2). Neutral — no theme styles. The file is saved only after the whole
// body has arrived, so a failure never leaves half a PDF; a failure says so and offers ลองใหม่.
import { useState } from "react";
import { building, exportPdf as exportWord, failed } from "./words";

/** The server's file name from `Content-Disposition: attachment; filename*=UTF-8''<name>`. */
function fileNameOf(header: string | null): string | null {
  const m = header ? /filename\*=UTF-8''([^;]+)/i.exec(header) : null;
  if (!m) return null;
  try { return decodeURIComponent(m[1]!); } catch { return null; }
}

export function ExportButton({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "building" | "failed">("idle");

  async function exportPdf() {
    setState("building");
    try {
      const res = await fetch(href, { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob(); // the whole body, or it throws
      const name = fileNameOf(res.headers.get("content-disposition"));
      if (blob.type !== "application/pdf" || !name) throw new Error("not a pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  // Failed: one button that says so and tries again (REQ-008 "สร้าง PDF ไม่สำเร็จ · ลองใหม่"), announced as an alert.
  if (state === "failed") {
    return (
      <span role="alert">
        <button type="button" onClick={exportPdf}>{failed}</button>
      </span>
    );
  }
  return (
    <button type="button" onClick={exportPdf} disabled={state === "building"} aria-busy={state === "building"}>
      {state === "building" ? building : exportWord}
    </button>
  );
}
