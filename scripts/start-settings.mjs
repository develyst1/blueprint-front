// The checks `bun run start` makes before it hands over to Next (SPEC-121 D3, REQ-123): which port to serve on, and whether it is free.
// Each returns the one line the service prints when something is wrong (stderr, exit 1), never throws for a bad setting.
import net from "node:net";

const DEFAULT_PORT = 3100;
const TAIL = "see README § Configuration";

/** The port to serve on: a `-p <n>` argument wins (Playwright passes one), then `PORT`, then 3100. An empty value counts as unset. */
export function portFrom(argv, env) {
  const i = argv.indexOf("-p");
  const raw = [i >= 0 ? argv[i + 1] : undefined, env.PORT].find((v) => v !== undefined && v !== "");
  if (raw === undefined) return { port: DEFAULT_PORT };
  const port = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(port >= 1 && port <= 65535)) return { line: `blueprint-front: wrong setting PORT ("${raw}" is not a port number) — ${TAIL}` };
  return { port };
}

/** `null` when the port can be listened on (all interfaces, as `next start` does), else the line to print. */
export function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      resolve(err.code === "EADDRINUSE"
        ? `blueprint-front: port ${port} is in use — ${TAIL}`
        : `blueprint-front: cannot listen on port ${port} (${err.code ?? "none"}) — ${TAIL}`);
    });
    server.listen(port, () => server.close(() => resolve(null)));
  });
}
