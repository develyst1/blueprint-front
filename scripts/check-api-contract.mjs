// AC-18 contract check: does the committed client (src/core/api/schema.d.ts) still match blueprint-back's OpenAPI
// document? Regenerates into a temp file and compares. Exit 0 = same, 1 = different (the diff is printed).
// The document: env BLUEPRINT_OPENAPI, else ../blueprint-back/openapi.json (both repos sit under is-root).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const spec = path.resolve(root, process.env.BLUEPRINT_OPENAPI || "../blueprint-back/openapi.json");
const committed = path.join(root, "src/core/api/schema.d.ts");

if (!existsSync(spec)) {
  console.error(`check:api — OpenAPI document not found: ${spec}`);
  process.exit(2);
}

const dir = mkdtempSync(path.join(tmpdir(), "check-api-"));
const fresh = path.join(dir, "schema.d.ts");
try {
  const gen = spawnSync(path.join(root, "node_modules/.bin/openapi-typescript"), [spec, "-o", fresh], { encoding: "utf8" });
  if (gen.status !== 0) {
    console.error(gen.stderr || gen.stdout);
    process.exit(2);
  }
  console.log(`compared against ${spec} (working tree, not a commit)`);
  if (readFileSync(fresh, "utf8") === readFileSync(committed, "utf8")) {
    console.log("check:api — src/core/api/schema.d.ts matches the OpenAPI document");
    process.exit(0);
  }
  const diff = spawnSync("diff", ["-u", committed, fresh], { encoding: "utf8" });
  console.error("check:api — src/core/api/schema.d.ts differs from the OpenAPI document (run `bun run gen:api`):");
  console.error(diff.stdout);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
