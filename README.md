# blueprint-front

The web app of Blueprint, the spec-authoring half of I-Space: people chat with an AI interview, read the spec it builds (overview, work order, flowchart, sequence, screens, API, requirements, history), and export it as a PDF. It is a Next.js app that reads and writes everything through **blueprint-back** (the API), so blueprint-back must be running for any project page to work. It serves on port **3100** by default.

## Prerequisites

Linux x64 (tested on Debian 13). Check each one with the command beside it:

| Need | Tested | Check |
|---|---|---|
| bun 1.4.x | 1.4.2 | `bun --version` |
| node ≥ 20.9 | 24.22.1 | `node --version` |
| Google Chrome (the PDF export drives it) | — | `google-chrome --version` |
| pm2 | 7.0.4 | `pm2 --version` (`npm install -g pm2` if missing) |
| blueprint-back, running | — | see its README |

## Install

```bash
git clone -b atom <repo URL> blueprint-front
cd blueprint-front
bun install --frozen-lockfile
```

## Configuration

Copy `.env.example` to `.env.local` (git-ignored) and change what you need. Every setting is optional; `bun run start` reads `.env.local` and `.env` the way Next.js does, so pm2 needs no `env` block. Never commit `.env.local`.

| Name | What it is | Example | Required? (default) |
|---|---|---|---|
| `PORT` | The port `bun run start` (and pm2) serves on. A `-p <n>` argument wins over it. | `3100` | optional (3100) |
| `BLUEPRINT_API_URL` | Where blueprint-back listens. Read at run time, not at build time: change it and restart, no rebuild. | `http://127.0.0.1:4200` | optional (`http://127.0.0.1:4200`) |
| `CAW_URL` | Where the "ส่งไปสร้างที่ CAW" button on the ready screen opens: caw-front, its `/start` page. The user's **browser** opens it, so on a server it must be caw-front's address **as the user's browser reaches it**, not `127.0.0.1`. | `https://caw.example.com` | optional (`http://127.0.0.1:3500`) |
| `BLUEPRINT_DEV_PAGES` | `1` serves the development pages under `/dev`; unset, they answer 404. Leave it unset on a server. | `1` | optional (unset) |
| `NEXT_DIST_DIR` | The folder `next build` writes to and `next start` reads from. Set it the same for both. | `.next` | optional (`.next`) |

Scripts and tests only (nothing here is needed to run the app):

| Name | What it is | Example | Required? (default) |
|---|---|---|---|
| `BLUEPRINT_OPENAPI` | Path of blueprint-back's `openapi.json`, for `bun run gen:api` and `bun run check:api`. | `../blueprint-back/openapi.json` | optional (that path) |
| `BLUEPRINT_BACK` | The blueprint-back folder the test seeds and fixtures are read from. | `../blueprint-back` | optional (that path) |
| `BLUEPRINT_PDF_CHROME_CHANNEL` | The browser channel the PDF export launches. A test sets it to a name that does not exist, to see the export fail cleanly. | — | optional (`chrome`) |
| `PLAYWRIGHT_PORT` | Port of the production server the Playwright specs start. | `3100` | optional (3100) |
| `PLAYWRIGHT_OUTPUT` | Folder for Playwright's own output. | `test-results` | optional (`test-results`) |
| `CHECK_BASE_URL` | The front the required-content check (`scripts/check-required.ts`) visits. | `http://127.0.0.1:3101` | optional |
| `CHECK_EXTRA_PORT` | The second port that check uses for its extra run. | `3102` | optional |
| `ISOLATION_SCREENSHOT` | A file path: when set, the isolation spec also saves a screenshot of its page there. | — | optional (unset) |
| `TZ` | Do not set it: the date tests set the time zone themselves. | — | leave unset |

## Build

```bash
bun run build
```

One build serves any settings: the API address is read when the app starts, so a different `BLUEPRINT_API_URL` needs a restart, not a rebuild.

## Start, stop, restart, logs

With pm2 (one process, named `blueprint-front`):

```bash
pm2 start ecosystem.config.cjs   # first time
pm2 restart blueprint-front
pm2 stop blueprint-front
pm2 logs blueprint-front
pm2 save                         # so `pm2 resurrect` / `pm2 startup` bring it back after a reboot
```

`pm2 startup` is a one-off that needs root; it is the owner's. Without pm2: `bun run start` (stop it with Ctrl-C).

## Check it is up

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/
```

It prints `200`. After a start or restart, allow a few seconds. Use your `PORT` if you changed it.

## Update

```bash
git pull                       # branch atom
bun install --frozen-lockfile
bun run build
pm2 restart blueprint-front
```

Then run "Check it is up" again.

## Start-up errors

If a setting is wrong the app prints one line and exits with code 1 (with pm2, the same line repeats in `pm2 logs blueprint-front`).

| Line | What to do |
|---|---|
| `blueprint-front: wrong setting PORT ("<value>" is not a port number) — see README § Configuration` | `PORT` (or the `-p` argument) must be a whole number from 1 to 65535. Fix it in `.env.local`. |
| `blueprint-front: port <port> is in use — see README § Configuration` | Another program already listens on that port. Stop it, or set a different `PORT`. `ss -ltn` shows what is listening. |
| `blueprint-front: cannot listen on port <port> (<code>) — see README § Configuration` | The system refused the port (for example `EACCES` for a port below 1024 without root). Choose another `PORT`. |

## I-Space on one server

I-Space is four services. Default ports (each one's `PORT` / start setting can change it):

| Service | Port | Talks to | Setting that points at it |
|---|---|---|---|
| blueprint-back (API) | 4200 | its database | blueprint-front `BLUEPRINT_API_URL` · caw-back `BLUEPRINT_URL` |
| blueprint-front (web) | 3100 | blueprint-back; opens caw-front in the user's browser | caw-back `BLUEPRINT_WEB_URL` · caw-front `BLUEPRINT_URL` |
| caw-back (API, MCP, runner) | 4500 | its database, blueprint-back, Claude CLI | caw-front `CAW_API_URL` |
| caw-front (web) | 3500 | caw-back | blueprint-front `CAW_URL` (the user's browser opens it) |

Start order: blueprint-back → blueprint-front → caw-back → caw-front. Only the two web ports (3100, 3500) must be reachable from users' browsers; the APIs can stay on 127.0.0.1.

First time on a new server: install the prerequisites of all four READMEs → clone all four on branch `atom` → fill each `.env` → blueprint-back `bun run db:migrate` → caw-back's database and CAW work folder steps (caw-back README) → Claude CLI installed and logged in to the subscription as the user pm2 runs CAW as (caw-back README) → build both fronts → `pm2 start ecosystem.config.cjs` in each repo, in the order above → each README's "Check it is up" → `pm2 save`.
