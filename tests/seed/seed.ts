// Seed a local, in-memory blueprint-back with one project (TASK-B-005).
// Usage: bun run tests/seed/seed.ts <apiUrl> <worked|every-stuck|empty|large|history> [--theme <id>]
// Only http://127.0.0.1:<port> is accepted — never SIT, never anything remote.
// The worked example is imported from blueprint-back's own fixture: env BLUEPRINT_BACK, else ../blueprint-back.
// `--theme` = the project's theme, default clean-blue; any id is passed through (the back end stores it unchecked).
// `worked` also gets one more change set: its "สร้างการจอง" API (POST /bookings) with an invented request body and one
// 201 response body, so an API page has bodies to show (TASK-B-014; the recorded fixtures are not re-recorded).
// `history` = the worked example plus two later change sets on Q-001 (its proposedAnswer updated twice, title
// unchanged), so one part has ≥ 2 history entries (TASK-B-009, for Team C's C-007 / QA's AC-11).
import path from "node:path";
import { everyStuckKind } from "./every-stuck-kind";
import { large } from "./large";

export type SeedKind = "worked" | "every-stuck" | "empty" | "large" | "history";
const KINDS: SeedKind[] = ["worked", "every-stuck", "empty", "large", "history"];
export type Seeded = { id: string; stuckCount: number; changeSetId: string | null; keys: Record<string, string> };

const LOCAL = /^http:\/\/127\.0\.0\.1:\d+$/;

export function assertLocal(apiUrl: string) {
  if (!LOCAL.test(apiUrl)) throw new Error(`refused: ${apiUrl} — only http://127.0.0.1:<port> is allowed`);
}

export async function call(apiUrl: string, method: string, route: string, body?: unknown) {
  assertLocal(apiUrl);
  const res = await fetch(apiUrl + route, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function workedExample(): Promise<unknown[]> {
  const back = path.resolve(process.cwd(), process.env.BLUEPRINT_BACK || "../blueprint-back");
  const mod = await import(path.join(back, "test/fixtures/meeting-room.ts"));
  return mod.meetingRoom;
}

export async function seed(apiUrl: string, kind: SeedKind, theme = "clean-blue"): Promise<Seeded> {
  assertLocal(apiUrl);
  const names: Record<SeedKind, string> = { worked: "จองห้องประชุม", "every-stuck": "งานทดลองที่ติดทุกแบบ", empty: "โปรเจกต์ว่าง", large: "งานทดลองขนาดใหญ่", history: "จองห้องประชุม" };
  const project = await call(apiUrl, "POST", "/v1/projects", { name: names[kind], theme });
  let changeSetId: string | null = null;
  let keys: Record<string, string> = {};
  if (kind !== "empty") {
    const changes = kind === "worked" || kind === "history" ? await workedExample() : kind === "large" ? large : everyStuckKind;
    const cs = await call(apiUrl, "POST", `/v1/projects/${project.id}/change-sets`, { cause: { kind: "operator" }, changes });
    changeSetId = cs.changeSetId;
    keys = cs.keys;
  }
  if (kind === "worked") {
    // an update replaces the whole body (SPEC-A-001), so method and path go with the bodies
    await call(apiUrl, "POST", `/v1/projects/${project.id}/change-sets`, {
      cause: { kind: "operator" },
      changes: [{
        op: "part.update",
        key: keys["$api2"],
        body: {
          method: "POST",
          path: "/bookings",
          request: { roomId: "room-101", start: "2026-10-12T09:00:00+07:00", end: "2026-10-12T10:00:00+07:00" },
          responses: [{ status: 201, body: { id: "booking-001", status: "pending" } }],
        },
      }],
    });
  }
  if (kind === "history") {
    // an update replaces the whole body (SPEC-A-001), so text and status are carried over unchanged
    for (const n of [1, 2]) {
      await call(apiUrl, "POST", `/v1/projects/${project.id}/change-sets`, {
        cause: { kind: "operator" },
        changes: [{ op: "part.update", key: "Q-001", body: { text: "ผู้ดูแลไม่ตอบใน 24 ชม. ทำอย่างไร", proposedAnswer: `ยกเลิกอัตโนมัติและแจ้งพนักงาน (แก้ครั้งที่ ${n})`, status: "open" } }],
      });
    }
  }
  const stuck = await call(apiUrl, "GET", `/v1/projects/${project.id}/stuck`);
  return { id: project.id, stuckCount: stuck.items.length, changeSetId, keys };
}

if (import.meta.main) {
  const [apiUrl, kind, ...rest] = process.argv.slice(2);
  const at = rest.indexOf("--theme");
  const theme = at >= 0 ? rest[at + 1] : "clean-blue";
  if (!apiUrl || !KINDS.includes(kind as SeedKind) || !theme) {
    console.error(`usage: bun run tests/seed/seed.ts <apiUrl> <${KINDS.join("|")}> [--theme <id>]`);
    process.exit(1);
  }
  const s = await seed(apiUrl, kind as SeedKind, theme);
  console.log(`seeded ${kind}: project ${s.id} · theme ${theme} · stuck ${s.stuckCount}`);
}
