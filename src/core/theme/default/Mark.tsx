// Puts a required item's marker on the element that shows its text (SPEC-B-001: data-required on an element whose
// visible text contains item.text). Paired by id (v1.3) — never by text.
import type { ReactNode } from "react";
import type { RequiredItem } from "../contract";
import { findRequired, requiredProps } from "../required";

export function Mark({ required, id, children }: { required: RequiredItem[]; id: string; children: ReactNode }) {
  const item = findRequired(required, id);
  return item ? <span {...requiredProps(item)}>{children}</span> : <>{children}</>;
}

/** The same for SVG text: the marker goes on the <text> itself. */
export function markAttrs(required: RequiredItem[], id: string) {
  const item = findRequired(required, id);
  return item ? requiredProps(item) : {};
}
