// `bun run start` (SPEC-121 D3, REQ-123): load the env the way Next does, check the port, then run `next start` in this same process
// (one process, so pm2's stop and restart reach Next directly). A bad setting is one line on stderr and exit 1.
import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portFree, portFrom } from "./start-settings.mjs";

nextEnv.loadEnvConfig(process.cwd());

const settled = portFrom(process.argv.slice(2), process.env);
const line = "line" in settled ? settled.line : await portFree(settled.port);
if (line) {
  console.error(line);
  process.exit(1);
}

const nextBin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "next", "dist", "bin", "next");
process.argv = [process.argv[0], nextBin, "start", "-p", String(settled.port)];
await import("next/dist/bin/next");
