// pm2 (SPEC-121 D4, REQ-123): one process. `cwd` is what lets scripts/start.mjs find .env.local; settings are not repeated here.
module.exports = { apps: [{ name: "blueprint-front", cwd: __dirname, script: "scripts/start.mjs", interpreter: "node" }] };
