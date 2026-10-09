// A larger invented project (TASK-B-006, REVIEW-A-001 A6) to stress the shared layouts: 15 steps, 3 forks of two
// labelled arrows each (two of them skip layers, so bend slots are exercised), 20 participants spread across the
// steps, every step with interactions. All text is invented test data — no client data.
type Origin = { stamp: "operator"; date: string };
type Change =
  | { op: "part.add"; ref: string; kind: string; title: string; body: Record<string, unknown>; origin: Origin }
  | { op: "link.add"; kind: string; from: string; to: string; origin: Origin; label?: string; position?: number };

const origin: Origin = { stamp: "operator", date: "2026-10-09" };
const part = (ref: string, kind: string, title: string, body: Record<string, unknown> = {}): Change =>
  ({ op: "part.add", ref, kind, title, body, origin });
const link = (kind: string, from: string, to: string, extra: { label?: string; position?: number } = {}): Change =>
  ({ op: "link.add", kind, from, to, origin, ...extra });

const roles = ["ผู้ร้องขอ", "ผู้ตรวจสอบ", "ผู้อนุมัติ", "ผู้ดูแลระบบ", "ผู้ประสานงาน"];
const screens = ["หน้าคำขอ", "หน้ารายการ", "หน้าตรวจสอบ", "หน้าอนุมัติ", "หน้าสรุป", "หน้าแจ้งผล"];
const apis = ["ส่งคำขอ", "ดึงรายการ", "บันทึกผลตรวจ", "บันทึกการอนุมัติ", "ส่งการแจ้งเตือน"];
const systems = ["ระบบเอกสาร", "ระบบอีเมล", "ระบบบัญชี", "ระบบรายงาน"];
const stepTitles = Array.from({ length: 15 }, (_, i) => `ขั้นที่ ${i + 1}`);

// next: [from, to, label] — three forks: 3 → 4 | 6 · 7 → 8 | 10 · 11 → 12 | 14
const next: [number, number, string | null][] = [
  [1, 2, null], [2, 3, null],
  [3, 4, "เส้นทางปกติ"], [3, 6, "ข้ามการเตรียม"],
  [4, 5, null], [5, 6, null], [6, 7, null],
  [7, 8, "ผ่านการตรวจ"], [7, 10, "ไม่ผ่านการตรวจ"],
  [8, 9, null], [9, 10, null], [10, 11, null],
  [11, 12, "ต้องแก้ไข"], [11, 14, "ไม่ต้องแก้ไข"],
  [12, 13, null], [13, 14, null], [14, 15, null],
];

const changes: Change[] = [part("$w", "work", "งานทดลองขนาดใหญ่")];
roles.forEach((t, i) => changes.push(part(`$r${i}`, "role", t)));
screens.forEach((t, i) => changes.push(part(`$sc${i}`, "screen", t)));
apis.forEach((t, i) => changes.push(part(`$a${i}`, "api", t, { method: i % 2 ? "GET" : "POST", path: `/test/${i + 1}` })));
systems.forEach((t, i) => changes.push(part(`$sy${i}`, "system", t)));
stepTitles.forEach((t, i) => changes.push(part(`$s${i + 1}`, "step", t, { ends: i === 14 })));
stepTitles.forEach((_, i) => changes.push(link("has_step", "$w", `$s${i + 1}`, { position: i + 1 })));
next.forEach(([f, t, label], i) => changes.push(link("next", `$s${f}`, `$s${t}`, { position: i + 1, ...(label ? { label } : {}) })));

// Interactions: role → screen, screen → API, and on every third step API → system.
let n = 0;
for (let s = 1; s <= 15; s++) {
  const hops: [string, string, string][] = [
    [`$r${s % 5}`, `$sc${s % 6}`, `กรอกข้อมูลขั้น ${s}`],
    [`$sc${s % 6}`, `$a${s % 5}`, `ส่งข้อมูลขั้น ${s}`],
  ];
  if (s % 3 === 0) hops.push([`$a${s % 5}`, `$sy${(s / 3) % 4}`, `บันทึกลงระบบขั้น ${s}`]);
  hops.forEach(([from, to, text], j) => {
    const ref = `$i${++n}`;
    changes.push(part(ref, "interaction", text, { text }));
    changes.push(link("has_interaction", `$s${s}`, ref, { position: j + 1 }));
    changes.push(link("from", ref, from));
    changes.push(link("to", ref, to));
  });
}

export const large: Change[] = changes;
