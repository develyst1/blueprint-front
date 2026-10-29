// URL ↔ PageId: the route reads back exactly the segment the core's href() writes (pageSlug — TASK-B-007 Q2).
// One URL per page: anything else, `workOrder` included, is not a page.
import type { PageId } from "@/core/theme/contract";
import { pageSlug, ROUTED_PAGES } from "@/core/model/build/common";

const URL_TO_PAGE = new Map<string, PageId>(ROUTED_PAGES.map((p) => [pageSlug(p), p]));

export function pageFromUrl(segment: string): PageId | null {
  return URL_TO_PAGE.get(segment) ?? null;
}
