"use client";

// The print view's one client part (TASK-A-045): every <details> open, so nothing hides behind ดูรายละเอียด in a PDF
// (SPEC-A-007 § E1 item 2). CSS cannot open a <details>; this does it on mount and again just before printing.
import { useEffect } from "react";

export function PrintOpen() {
  useEffect(() => {
    const open = () => document.querySelectorAll("details").forEach((d) => { d.open = true; });
    open();
    window.addEventListener("beforeprint", open);
    return () => window.removeEventListener("beforeprint", open);
  }, []);
  return null;
}
