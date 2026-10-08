import s from "@/dev/isolation/screen.module.css";
import { AntBlock } from "@/dev/isolation/AntBlock";
import { CoreBlock } from "@/dev/isolation/CoreBlock";
import { requireDevPages } from "@/dev/isolation/guard";

export const dynamic = "force-dynamic";

export default function Page() {
  requireDevPages();
  return (
    <main className={s.screen}>
      <CoreBlock />
      <AntBlock />
    </main>
  );
}
