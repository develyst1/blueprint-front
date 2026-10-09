// Themes never fetch (REVIEW-C-001 S6, SPEC-B-001): no file under src/themes/ may import the API client or call
// fetch(. Exit 1 naming each file and line.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/themes");
const files = [];
const walk = (dir) => {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(d.name)) files.push(p);
  }
};
try { walk(root); } catch { /* no themes yet */ }

const bad = [];
for (const f of files) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    if (/@\/core\/api\b|core\/api\//.test(line) || /\bfetch\s*\(/.test(line)) bad.push(`${path.relative(process.cwd(), f)}:${i + 1}: ${line.trim()}`);
  });
}
for (const b of bad) console.error(`check:no-fetch — ${b}`);
console.log(`check:no-fetch — ${files.length} theme files, ${bad.length} problems`);
process.exit(bad.length ? 1 : 0);
