import { requireDevPages } from "@/dev/isolation/guard";
import { Showcase } from "@/themes/luxury-gold/dev/Showcase";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return <Showcase />;
}
