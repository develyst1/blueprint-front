import s from "@/dev/isolation/screen.module.css";
import { AntBlock } from "@/dev/isolation/AntBlock";
import { CoreBlock } from "@/dev/isolation/CoreBlock";
import { MantineBlock } from "@/dev/isolation/MantineBlock";
import { HeroBlock } from "@/dev/isolation/heroui/HeroBlock";
import { requireDevPages } from "@/dev/isolation/guard";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return (
    <main className={s.screen}>
      <CoreBlock />
      <AntBlock />
      <MantineBlock />
      <HeroBlock />
    </main>
  );
}
