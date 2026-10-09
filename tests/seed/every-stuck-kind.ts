// A small invented project (TASK-B-005) whose spec is stuck in every way blueprint-back reports, all at once:
// open_question · unlinked_part · flow_break × 5 reasons · unconfirmed_guess (a part, and a link) · screen_without_api.
// All text is invented test data. Applied as one change set; refs ($…) become keys on the way in.
type Origin = { stamp: "operator" | "team-proposed"; date: string };
type Change =
  | { op: "part.add"; ref: string; kind: string; title: string; body: Record<string, unknown>; origin: Origin }
  | { op: "link.add"; kind: string; from: string; to: string; origin: Origin; label?: string; position?: number };

const date = "2026-10-09";
const op: Origin = { stamp: "operator", date };
const guess: Origin = { stamp: "team-proposed", date };

const part = (ref: string, kind: string, title: string, body: Record<string, unknown> = {}, origin = op): Change =>
  ({ op: "part.add", ref, kind, title, body, origin });
const link = (kind: string, from: string, to: string, extra: { label?: string; position?: number; origin?: Origin } = {}): Change =>
  ({ op: "link.add", kind, from, to, origin: extra.origin ?? op, ...(extra.label ? { label: extra.label } : {}), ...(extra.position ? { position: extra.position } : {}) });

export const everyStuckKind: Change[] = [
  part("$w", "work", "งานทดลองที่ติดทุกแบบ"),
  part("$s1", "step", "ขั้นแรก", { ends: false }),            // two `next` without a label → unlabelled_branch
  part("$s2", "step", "ขั้นที่ไม่ไปต่อ", { ends: false }),     // no `next`, not an end → dead_end; no interaction → no_interactions
  part("$s3", "step", "ขั้นที่ข้อมูลไม่ครบ", { ends: true }),  // an interaction without a `to` → incomplete_interaction
  part("$s4", "step", "ขั้นที่ไปไม่ถึง", { ends: true }),      // nothing leads here → unreachable
  part("$r1", "role", "ผู้ใช้ทดลอง"),
  part("$r2", "role", "ผู้ใช้ที่บอทเดา", {}, guess),           // team-proposed part → unconfirmed_guess
  part("$sc1", "screen", "หน้าทดลอง"),                          // shows data, no API reaches it → screen_without_api
  part("$d1", "data", "ข้อมูลทดลอง"),
  part("$d2", "data", "ข้อมูลที่ไม่มีใครใช้"),                   // no link at all → unlinked_part
  part("$i1", "interaction", "เปิดหน้าทดลอง", { text: "เปิดหน้าทดลอง" }),
  part("$i2", "interaction", "ส่งข้อมูลโดยยังไม่รู้ผู้รับ", { text: "ส่งข้อมูลโดยยังไม่รู้ผู้รับ" }),
  part("$i3", "interaction", "ดูหน้าทดลอง", { text: "ดูหน้าทดลอง" }),
  part("$q", "question", "คำถามที่ยังเปิดอยู่", { text: "คำถามที่ยังเปิดอยู่", proposedAnswer: "คำตอบทดลอง", status: "open" }),

  link("has_step", "$w", "$s1", { position: 1 }),
  link("has_step", "$w", "$s2", { position: 2 }),
  link("has_step", "$w", "$s3", { position: 3 }),
  link("has_step", "$w", "$s4", { position: 4 }),
  link("next", "$s1", "$s2", { position: 1 }),
  link("next", "$s1", "$s3", { position: 2 }),
  link("has_interaction", "$s1", "$i1", { position: 1 }),
  link("from", "$i1", "$r1"),
  link("to", "$i1", "$sc1"),
  link("has_interaction", "$s3", "$i2", { position: 1 }),
  link("from", "$i2", "$r1"),
  link("has_interaction", "$s4", "$i3", { position: 1 }),
  link("from", "$i3", "$r2"),
  link("to", "$i3", "$sc1"),
  link("shows", "$sc1", "$d1", { origin: guess }), // team-proposed link → unconfirmed_guess on its `from` part
  link("about", "$q", "$s2"),                      // open question about STEP "ขั้นที่ไม่ไปต่อ"
];
