// Records the API responses the loaders read, so builder tests run without a server (TASK-B-005).
// Needs an in-memory back end:  (blueprint-back)  DATABASE_URL=pglite:memory PORT=4299 bun run src/index.ts
// Usage:  bun run scripts/record-api-fixtures.ts [apiUrl = http://127.0.0.1:4299]
// Seeds the three projects, changes one part of `every-stuck` twice (for the history test), then writes
// tests/fixtures/api/<project>-<route>.json — <project> = worked | every-stuck | empty | large | history.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertLocal, call, seed, type SeedKind } from "../tests/seed/seed";

const apiUrl = process.argv[2] || "http://127.0.0.1:4299";
assertLocal(apiUrl);
const outDir = path.join(process.cwd(), "tests/fixtures/api");
mkdirSync(outDir, { recursive: true });

const existing = await call(apiUrl, "GET", "/v1/projects");
if (existing.length) throw new Error("refused: the back end already holds projects — start a fresh pglite:memory back end");

const written: string[] = [];
const save = (name: string, json: unknown) => {
  writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(json, null, 2) + "\n");
  written.push(name);
};

const kinds: SeedKind[] = ["worked", "every-stuck", "empty", "large"];
const seeded = Object.fromEntries(await Promise.all(kinds.map(async (k) => [k, await seed(apiUrl, k)] as const)));

// A part changed twice, oldest first: the unused data part of every-stuck gets two title changes.
const changed = seeded["every-stuck"].keys["$d2"]!;
for (const title of ["ข้อมูลที่ไม่มีใครใช้ (แก้ครั้งที่ 1)", "ข้อมูลที่ไม่มีใครใช้ (แก้ครั้งที่ 2)"]) {
  await call(apiUrl, "POST", `/v1/projects/${seeded["every-stuck"].id}/change-sets`, {
    cause: { kind: "operator" },
    changes: [{ op: "part.update", key: changed, title }],
  });
}

save("projects", await call(apiUrl, "GET", "/v1/projects"));
for (const kind of kinds) {
  const id = seeded[kind].id;
  const p = `/v1/projects/${id}`;
  const spec = await call(apiUrl, "GET", p);
  save(`${kind}-project`, spec);
  save(`${kind}-stuck`, await call(apiUrl, "GET", `${p}/stuck`));
  type L = { kind: string; fromKey: string; toKey: string };
  for (const work of spec.parts.filter((x: { kind: string }) => x.kind === "work")) {
    save(`${kind}-flowchart-${work.key}`, await call(apiUrl, "GET", `${p}/diagrams/flowchart/${work.key}`));
    save(`${kind}-swimlane-${work.key}`, await call(apiUrl, "GET", `${p}/diagrams/swimlane/${work.key}`));
    for (const l of spec.links.filter((x: L) => x.kind === "has_step" && x.fromKey === work.key)) {
      save(`${kind}-sequence-${l.toKey}`, await call(apiUrl, "GET", `${p}/diagrams/sequence/${l.toKey}`));
    }
  }
}
save("worked-history-DEC-001", await call(apiUrl, "GET", `/v1/projects/${seeded.worked.id}/parts/DEC-001/history`));
save(`every-stuck-history-${changed}`, await call(apiUrl, "GET", `/v1/projects/${seeded["every-stuck"].id}/parts/${changed}/history`));

// The `history` seed (TASK-B-009): the worked example with Q-001 changed twice — its link entry and both updates.
const history = await seed(apiUrl, "history");
save("history-project", await call(apiUrl, "GET", `/v1/projects/${history.id}`));
save("history-stuck", await call(apiUrl, "GET", `/v1/projects/${history.id}/stuck`));
save("history-history-Q-001", await call(apiUrl, "GET", `/v1/projects/${history.id}/parts/Q-001/history`));

console.log(kinds.map((k) => `${k}: project ${seeded[k].id} · stuck ${seeded[k].stuckCount}`).join("\n"));
console.log(`wrote ${written.length} files to tests/fixtures/api/ · changed part ${changed}`);
