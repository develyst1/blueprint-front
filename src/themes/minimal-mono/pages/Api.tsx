import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Title.css";
import { Card, Group, SimpleGrid, Stack, Title } from "@mantine/core";
import type { ApiVM, ApisVM, RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import { apiDetail, apiGroup, emptyList } from "@/core/words";
import { Disclosure } from "../parts/Disclosure";
import { KindMark } from "../parts/KindMark";
import { RequiredList, RequiredPicker } from "../parts/Required";
import { StuckIcon } from "../parts/StuckIcon";
import s from "./cards.module.css";

// API in minimal mono (TASK-A-022): one card per endpoint — method + path, title, what it reads and writes (links),
// each response's status + note under ผลที่ได้กลับ. The request and the response bodies are spec content (JSON) and live
// behind ดูรายละเอียด, formatted, under ข้อมูลที่ส่งเข้า / ผลที่ได้กลับ (apiDetail, contract v1.8 — TASK-A-038).
const json = (v: unknown) => (v === null || v === undefined ? null : typeof v === "string" ? v : JSON.stringify(v, null, 2));

function Links({ head, items }: { head: string; items: ApiVM["reads"] }) {
  if (!items.length) return null;
  return (
    <section className={s.group}>
      <h3 className={s.groupHead}>{head}</h3>
      <ul className={s.links}>
        {items.map((d) => (
          <li key={d.key}>
            <KindMark kind="data" size={14} />
            <a href={d.href} className={s.link}>{d.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Api({ vm, required }: { vm: ApisVM; required: RequiredItem[] }) {
  const picker = new RequiredPicker(required);
  // no APIs yet: the page says so (D-015) instead of drawing a blank canvas
  if (vm.apis.length === 0) {
    return (
      <Stack gap="lg">
        <Card padding="lg" radius="lg" className={s.card}>
          <span className={s.emptyWord}>{emptyList.api}</span>
        </Card>
        <RequiredList items={picker.rest()} />
      </Stack>
    );
  }
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {vm.apis.map((a, i) => {
          const request = json(a.request);
          const titleId = `mono-api-${i}`;
          const bodies = a.responses.map((r) => json(r.body)).filter(Boolean);
          return (
            <Card key={a.key} padding="lg" radius="lg" className={a.stuck ? `${s.card} ${s.cardStuck}` : s.card}>
              <Stack gap="md">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <span className={s.mark}><KindMark kind="api" size={18} solid={a.stuck} /></span>
                  <Title order={2} id={titleId} className={s.title} {...picker.takeId(requiredId.api(a.key))}>
                    {a.title}
                  </Title>
                  {a.stuck ? <StuckIcon /> : null}
                </Group>
                <Group gap={10} wrap="nowrap" align="center">
                  <span className={s.method}>{a.method}</span>
                  <code className={s.path}>{a.path}</code>
                </Group>
                {a.stuck && a.stuckWordings.length ? (
                  <ul className={s.stuckWords}>
                    {a.stuckWordings.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                ) : null}
                <Links head={apiGroup.reads} items={a.reads} />
                <Links head={apiGroup.writes} items={a.writes} />
                {a.responses.length ? (
                  <section className={s.group}>
                    <h3 className={s.groupHead}>{apiDetail.response}</h3>
                    <ul className={s.lines}>
                      {a.responses.map((r) => (
                        <li key={r.status}>
                          <span className={s.status}>{r.status}</span>
                          {r.note ? <span className={s.lineSub}>{r.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {request || bodies.length ? (
                  <div>
                    <Disclosure describedBy={titleId}>
                      <div className={s.more}>
                        {request ? (
                          <section className={s.group}>
                            <h3 className={s.groupHead}>{apiDetail.request}</h3>
                            <pre className={s.json}>{request}</pre>
                          </section>
                        ) : null}
                        {bodies.length ? (
                          <section className={s.group}>
                            <h3 className={s.groupHead}>{apiDetail.response}</h3>
                            {a.responses.map((r) => {
                              const b = json(r.body);
                              return b ? (
                                <div key={r.status} className={s.bodyBlock}>
                                  <span className={s.status}>{r.status}</span>
                                  <pre className={s.json}>{b}</pre>
                                </div>
                              ) : null;
                            })}
                          </section>
                        ) : null}
                      </div>
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
