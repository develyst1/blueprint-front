import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Grid.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Title.css";
import { Grid, GridCol, Paper, Stack, Text, Title } from "@mantine/core";
import type { HistoryVM, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { historyPick, pageLabel, partKind } from "@/core/words";
import { KindMark } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StripScroll } from "../shell/StripScroll";
import s from "./cards.module.css";

// ประวัติ in minimal mono (TASK-A-022, A-038): the parts as a list of the core's links, each with its kind's shape (and
// the kind's word for a screen reader), so two parts with the same title read apart (v1.8); with no part chosen, the
// historyPick prompt. The chosen part's changes in the core's order — oldest first (REQ-002 AC-11): what · when · by
// what · what was done. An empty `summary` (v1.8) or `whatLabel` is left out; the `what` code is never shown.
export function History({ vm, required }: { vm: HistoryVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  return (
    <Grid gap="lg">
      {/* the chosen part's history comes first in the DOM (read first on a phone, not after every part's link);
          from md the list of parts sits on the left by CSS order */}
      {vm.part ? (
        <GridCol span={{ base: 12, md: 8, xl: 9 }} order={{ base: 1, md: 2 }}>
          <Paper radius="lg" p="lg" className={s.card}>
            <Stack gap="lg">
              <Title order={2} className={s.title} {...picker.takeId(requiredId.part(vm.part.key))}>
                {vm.part.title}
              </Title>
              <ol className={s.timeline}>
                {vm.entries.map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <span className={s.dot} aria-hidden="true" />
                    <div>
                      {e.summary ? (
                        <Text fz="md" fw={700} lh={1.5} lineClamp={2}>
                          {e.summary}
                        </Text>
                      ) : null}
                      <div className={e.summary ? s.meta : `${s.meta} ${s.metaOnly}`}>
                        <time dateTime={e.at}>{e.atLabel}</time>
                        <span>{e.cause}</span>
                        {e.whatLabel ? <span className={s.what}>{e.whatLabel}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Stack>
          </Paper>
        </GridCol>
      ) : (
        <GridCol span={{ base: 12, md: 8, xl: 9 }} order={{ base: 1, md: 2 }}>
          <Paper radius="lg" p="lg" className={s.card}>
            <Text fz="lg" fw={700} lh={1.5}>
              {historyPick}
            </Text>
          </Paper>
        </GridCol>
      )}
      <GridCol span={{ base: 12, md: 4, xl: 3 }} order={{ base: 2, md: 1 }}>
        {/* bounded with a part chosen: opened on that part's link (StripScroll — never scrollIntoView) */}
        <StripScroll className={vm.part ? `${s.partList} ${s.partListBounded}` : s.partList}>
        <nav aria-label={pageLabel.history}>
          <ul>
            {vm.parts.map((p) => (
              <li key={p.key}>
                <a href={p.href} aria-current={vm.part?.key === p.key ? "page" : undefined} className={s.partLink}>
                  <KindMark kind={p.kind} size={16} />
                  <span className={s.srOnly}>{partKind[p.kind]}</span>
                  <span>{p.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        </StripScroll>
      </GridCol>
      <GridCol span={12} order={3}>
        <RequiredList items={picker.rest()} />
      </GridCol>
    </Grid>
  );
}
