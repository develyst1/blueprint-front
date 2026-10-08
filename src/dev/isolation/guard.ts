import { notFound } from "next/navigation";

// The isolation routes exist only when BLUEPRINT_DEV_PAGES=1 at request time.
export function requireDevPages() {
  if (process.env.BLUEPRINT_DEV_PAGES !== "1") notFound();
}
