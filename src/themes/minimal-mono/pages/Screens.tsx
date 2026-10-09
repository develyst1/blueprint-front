import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Title.css";
import { Card, Group, SimpleGrid, Stack, Title } from "@mantine/core";
import type { RequiredItem, ScreenVM, ScreensVM } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { emptyList, partKind, screenGroup } from "@/core/words";
import { Disclosure } from "../parts/Disclosure";
import { KindMark } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./cards.module.css";

// หน้าจอ in minimal mono (TASK-A-022): one card per screen — title, what it shows (links), and its fields,
// actions and states as short lines. A card with more than SHOWN lines keeps the rest behind ดูรายละเอียด (AC-8).
const SHOWN = 6;

// Lines [from, to) of the card, counted across the three groups in order; a group split by the cut repeats its heading.
function Groups({ screen, from = 0, to = Infinity }: { screen: ScreenVM; from?: number; to?: number }) {
  let start = 0;
  const groups = [
    { key: "fields", head: screenGroup.fields, lines: screen.fields.map((f) => ({ k: f.name, main: f.label ?? f.name, sub: f.type })) },
    { key: "actions", head: screenGroup.actions, lines: screen.actions.map((a) => ({ k: a.name, main: a.label ?? a.name, sub: null })) },
    { key: "states", head: screenGroup.states, lines: screen.states.map((st) => ({ k: st.name, main: st.name, sub: st.note })) },
  ].map((g) => {
    const lines = g.lines.slice(Math.max(0, from - start), Math.max(0, to - start));
    start += g.lines.length;
    return { ...g, lines };
  }).filter((g) => g.lines.length > 0);
  return (
    <>
      {groups.map((g) => (
        <section key={g.key} className={s.group}>
          <h3 className={s.groupHead}>{g.head}</h3>
          <ul className={s.lines}>
            {g.lines.map((l) => (
              <li key={l.k}>
                <span className={s.lineMain}>{l.main}</span>
                {l.sub ? <span className={s.lineSub}>{l.sub}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function Screens({ vm, required }: { vm: ScreensVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  // no screens yet: the page says so (D-015) instead of drawing a blank canvas
  if (vm.screens.length === 0) {
    return (
      <Stack gap="lg">
        <Card padding="lg" radius="lg" className={s.card}>
          <span className={s.emptyWord}>{emptyList.screens}</span>
        </Card>
        <RequiredList items={picker.rest()} />
      </Stack>
    );
  }
  // the shapes this page uses, named as on the work order (REVIEW-C-002 row 11): ■ screen, and ▱ data when shown
  const kinds = (["screen", "data"] as const).filter((k) => k === "screen" ? vm.screens.length > 0 : vm.screens.some((sc) => sc.shows.length));
  return (
    <Stack gap="lg">
      {kinds.length ? (
        <Group gap="lg" className={s.legend}>
          {kinds.map((k) => (
            <Group key={k} gap={8} wrap="nowrap">
              <KindMark kind={k} size={16} />
              <span className={s.legendWord}>{partKind[k]}</span>
            </Group>
          ))}
        </Group>
      ) : null}
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {vm.screens.map((sc, i) => {
          const lineCount = sc.fields.length + sc.actions.length + sc.states.length;
          const titleId = `mono-screen-${i}`;
          return (
            <Card key={sc.key} padding="lg" radius="lg" className={sc.stuck ? `${s.card} ${s.cardStuck}` : s.card}>
              <Stack gap="md">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <span className={s.mark}><KindMark kind="screen" size={18} solid={sc.stuck} /></span>
                  <Title order={2} id={titleId} className={s.title} {...picker.takeId(requiredId.screen(sc.key))}>
                    {sc.title}
                  </Title>
                  {sc.stuck ? <StuckIcon /> : null}
                </Group>
                {sc.stuck && sc.stuckWordings.length ? (
                  <ul className={s.stuckWords}>
                    {sc.stuckWordings.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                ) : null}
                {sc.shows.length ? (
                  <ul className={s.links}>
                    {sc.shows.map((d) => (
                      <li key={d.key}>
                        <KindMark kind="data" size={14} />
                        <a href={d.href} className={s.link}>{d.title}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {lineCount > 0 ? <Groups screen={sc} to={SHOWN} /> : null}
                {lineCount > SHOWN ? (
                  <div>
                    <Disclosure describedBy={titleId}>
                      <div className={s.more}><Groups screen={sc} from={SHOWN} /></div>
                    </Disclosure>
                  </div>
                ) : null}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
      <RequiredList items={picker.rest()} />
    </Stack>
  );
}
