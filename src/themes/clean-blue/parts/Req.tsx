// Pairs a piece with its required item by id (contract v1.3): marks the element whose visible text is the item's text.
import type { ReactNode } from "react";
import type { RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredProps } from "@/core/theme/required";

export function Req({ required, id, children }: { required: RequiredItem[]; id: string; children: ReactNode }) {
  const item = findRequired(required, id);
  return item ? <span {...requiredProps(item)}>{children}</span> : <>{children}</>;
}

/** The same marker for SVG text. */
export function reqAttrs(required: RequiredItem[], id: string) {
  const item = findRequired(required, id);
  return item ? requiredProps(item) : {};
}
