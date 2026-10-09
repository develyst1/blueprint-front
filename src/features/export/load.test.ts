// The print view's cover and page plan against fixture data (invented, shaped as blueprint-back answers).
import { describe, expect, test } from "bun:test";
import { PAGES } from "@/core/model/build/common";
import type { ProjectData } from "@/core/model/build/types";
import { readinessClear, readinessStuck } from "@/core/words";
import { buildCover, plan } from "./load";

const origin = { stamp: "operator" as const, date: "2026-10-09" };
const part = (key: string, kind: string, title: string, body: Record<string, unknown> = {}) =>
  ({ key, kind, title, body, origin, createdIn: "cs-1" }) as ProjectData["parts"][number];
const link = (id: string, kind: string, fromKey: string, toKey: string, position: number | null = null) =>
  ({ id, kind, fromKey, toKey, label: null, position, origin, createdIn: "cs-1" }) as ProjectData["links"][number];
const data = (parts: ProjectData["parts"], links: ProjectData["links"] = [], stuck: ProjectData["stuck"] = []): ProjectData => ({
  project: { id: "p-1", organisationId: "o", name: "จองห้อง", createdAt: "2026-10-09T01:00:00.000Z", theme: "minimal-mono", model: "tier:small", creativity: 0.5 },
  parts, links, stuck,
});

describe("cover", () => {
  test("name, version or null, today in Thai, the frame's readiness, every stuck wording", () => {
    const d = data([part("WRK-001", "work", "งาน")], [], [{ kind: "open_question", key: "Q-001", title: "q" } as ProjectData["stuck"][number]]);
    const c = buildCover({ data: d, version: 3, stuck: ["ยังมีคำถามที่ยังไม่ได้ตอบ", "บอทเดาไว้ ยังไม่ได้รับการยืนยัน"], now: new Date("2026-10-09T05:00:00.000Z") });
    expect(c).toEqual({ name: "จองห้อง", version: 3, exportDate: "9 ต.ค. 2569", readiness: readinessStuck(1), stuck: ["ยังมีคำถามที่ยังไม่ได้ตอบ", "บอทเดาไว้ ยังไม่ได้รับการยืนยัน"] });
  });

  test("not confirmed → version null; nothing stuck → the clear readiness (D-031: not yet ready to build)", () => {
    const c = buildCover({ data: data([part("WRK-001", "work", "งาน")]), version: null, stuck: [], now: new Date("2026-10-09T05:00:00.000Z") });
    expect([c.version, c.readiness, c.stuck]).toEqual([null, readinessClear, []]);
  });
});

describe("plan", () => {
  const d = data(
    [
      part("WRK-001", "work", "งานหนึ่ง"), part("WRK-002", "work", "งานสอง"),
      part("STEP-001", "step", "ขั้นแรก"), part("STEP-002", "step", "ขั้นสอง", { ends: true }), part("STEP-003", "step", "ขั้นสาม", { ends: true }),
    ],
    [link("l1", "has_step", "WRK-001", "STEP-001", 1), link("l2", "has_step", "WRK-001", "STEP-002", 2), link("l3", "has_step", "WRK-002", "STEP-003", 1)],
  );
  const p = plan(d);

  test("pages in PAGES order (each page's first appearance)", () => {
    expect([...new Set(p.map((x) => x.page))]).toEqual(PAGES);
  });

  test("workOrder and flowchart once per work, sequence once per step of every work, history once per part", () => {
    const count = (page: string) => p.filter((x) => x.page === page).length;
    expect([count("workOrder"), count("flowchart"), count("sequence"), count("history"), count("overview")]).toEqual([2, 2, 3, 5, 1]);
    expect(p.filter((x) => x.page === "sequence").map((x) => x.query.step)).toEqual(["STEP-001", "STEP-002", "STEP-003"]);
    expect(p.find((x) => x.page === "flowchart")!.subtitle).toBe("งานหนึ่ง");
  });
});
