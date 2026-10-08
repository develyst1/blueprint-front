import s from "@/dev/isolation/screen.module.css";
import { CoreBlock } from "@/dev/isolation/CoreBlock";
import { MantineBlock } from "@/dev/isolation/MantineBlock";
import { requireDevPages } from "@/dev/isolation/guard";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return (
    <main className={s.screen}>
      <CoreBlock />
      <MantineBlock />
    </main>
  );
}
