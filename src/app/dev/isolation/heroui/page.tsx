import s from "@/dev/isolation/screen.module.css";
import { CoreBlock } from "@/dev/isolation/CoreBlock";
import { HeroBlock } from "@/dev/isolation/heroui/HeroBlock";
import { requireDevPages } from "@/dev/isolation/guard";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return (
    <main className={s.screen}>
      <CoreBlock />
      <HeroBlock />
    </main>
  );
}
