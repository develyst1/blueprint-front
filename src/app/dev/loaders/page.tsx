// Dev only (TASK-B-005): runs every loader for one project and prints a one-line summary each — proof the data
// layer works against the live API. /dev/loaders?project=<id>   (BLUEPRINT_DEV_PAGES=1)
import { requireDevPages } from "@/dev/isolation/guard";
import { apiBaseUrl } from "@/core/api/client";
import { loadHome, loadPage, type Loaded } from "@/core/model/load";
import type { PageId, PageVMs } from "@/core/theme/contract";

export const dynamic = "force-dynamic";

const PAGES: PageId[] = ["overview", "workOrder", "flowchart", "sequence", "screens", "api", "web", "stuck", "history"];

function summary(page: PageId, r: Loaded<PageVMs[PageId]>): string {
  if (!r.ok) return `state ${JSON.stringify(r.state)}`;
  const v = r.vm as never as Record<string, unknown> & PageVMs[PageId];
  const f = v.frame;
  const head = `${f.project.name} · ${f.project.createdLabel} · ${f.readiness.label}`;
  switch (page) {
    case "overview": { const o = v as PageVMs["overview"]; return `${head} · works ${o.works.length} · steps ${o.works.map((w) => w.steps.map((s) => `${s.number}${s.stuck ? "!" : ""}`).join(" ")).join(" | ")} · decisions ${o.decisions.length}`; }
    case "workOrder": { const o = v as PageVMs["workOrder"]; return `${head} · ${o.layout.rows.length} rows × ${o.layout.lanes.length} lanes · handoffs ${o.layout.rows.map((x) => x.handoffs.length).join("/")}`; }
    case "flowchart": { const o = v as PageVMs["flowchart"]; return `${head} · nodes ${o.layouts.LR.nodes.length} · arrows ${o.layouts.LR.edges.length} · labels ${o.layouts.LR.edges.filter((e) => e.label).length}`; }
    case "sequence": { const o = v as PageVMs["sequence"]; return `${head} · step ${o.step.number} ${o.step.title} · messages ${o.layout.messages.length}`; }
    case "screens": { const o = v as PageVMs["screens"]; return `${head} · screens ${o.screens.length}`; }
    case "api": { const o = v as PageVMs["api"]; return `${head} · apis ${o.apis.map((a) => `${a.method} ${a.path}`).join(", ")}`; }
    case "web": { const o = v as PageVMs["web"]; return `${head} · nodes ${o.layout.nodes.length} · links ${o.layout.edges.length}`; }
    case "stuck": { const o = v as PageVMs["stuck"]; return `${head} · ${o.items.map((i) => `${i.key} → ${i.target.key}: ${i.wording}`).join(" · ")}`; }
    case "history": { const o = v as PageVMs["history"]; return `${head} · parts ${o.parts.length} · part ${o.part?.key ?? "none"} · entries ${o.entries.length}`; }
  }
  return "";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  requireDevPages();
  const { project } = await searchParams;
  const home = await loadHome();
  const rows = project ? await Promise.all(PAGES.map(async (p) => [p, summary(p, await loadPage(p, project))] as const)) : [];
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h1>loaders</h1>
      <p data-probe="api">api {apiBaseUrl}</p>
      <p data-probe="home">home: {home.ok ? `${home.vm.length} projects — ${home.vm.map((c) => `${c.project.name} (${c.readiness.label})`).join(", ")}` : `state ${JSON.stringify(home.state)}`}</p>
      <ul data-probe="pages">
        {rows.map(([p, s]) => <li key={p}><b>{p}</b>: {s}</li>)}
      </ul>
    </main>
  );
}
