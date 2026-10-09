import { requireDevPages } from "@/dev/isolation/guard";
import { Showcase } from "@/themes/minimal-mono/dev/Showcase";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return <Showcase />;
}
