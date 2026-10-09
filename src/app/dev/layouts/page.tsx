// Dev only (TASK-B-006): draws the shared layouts as plain boxes and lines — no design — to see the positions are
// sane. /dev/layouts?project=<id>&view=flowLR|flowTB|swim|seq|web[&step=<key>]   (BLUEPRINT_DEV_PAGES=1)
import { requireDevPages } from "@/dev/isolation/guard";
import { loadPage } from "@/core/model/load";
import { estimateLabel } from "@/core/layout";
import { nodeBox } from "@/core/layout/web";
import { FLOW } from "@/core/layout/flow";
import type { FlowLayout } from "@/core/theme/contract";

export const dynamic = "force-dynamic";

const VIEWS = ["flowLR", "flowTB", "swim", "seq", "web"] as const;
type View = (typeof VIEWS)[number];
const line = "#555", box = "#fff", stroke = "#222", label = "#0a4", text = "#111";

function Flow({ lay }: { lay: FlowLayout }) {
  return (
    <svg viewBox={`0 0 ${lay.width} ${lay.height}`} width="100%" style={{ maxHeight: "80vh" }}>
      {lay.edges.map((e, i) => (
        <polyline key={i} points={e.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={line} strokeWidth={2} />
      ))}
      {lay.nodes.map((n) => (
        <g key={n.key}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} fill={box} stroke={stroke} rx={n.ends ? n.h / 2 : 4} />
          <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 5} textAnchor="middle" fontSize={FLOW.titlePx} fill={text}>{n.key}</text>
        </g>
      ))}
      {lay.edges.filter((e) => e.labelAnchor).map((e, i) => {
        const s = estimateLabel(e.label!, FLOW.labelPx);
        return (
          <g key={`l${i}`}>
            <rect x={e.labelAnchor!.x - s.w / 2} y={e.labelAnchor!.y - s.h / 2} width={s.w} height={s.h} fill="#efe" stroke={label} />
            <text x={e.labelAnchor!.x} y={e.labelAnchor!.y + 5} textAnchor="middle" fontSize={FLOW.labelPx} fill={text}>{e.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ project?: string; view?: string; step?: string }> }) {
  requireDevPages();
  const { project, view: v, step } = await searchParams;
  const view: View = (VIEWS as readonly string[]).includes(v ?? "") ? (v as View) : "flowLR";
  if (!project) return <main><p>?project=&lt;id&gt;</p></main>;
  let body: React.ReactNode = null;
  if (view === "flowLR" || view === "flowTB") {
    const r = await loadPage("flowchart", project);
    body = r.ok ? <Flow lay={view === "flowLR" ? r.vm.layouts.LR : r.vm.layouts.TB} /> : <pre>{JSON.stringify(r.state)}</pre>;
  } else if (view === "swim") {
    const r = await loadPage("workOrder", project);
    body = r.ok ? (
      <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr><th />{r.vm.layout.lanes.map((l) => <th key={l.key} style={{ border: "1px solid #999", padding: 4 }}>{l.index}·{l.key}</th>)}</tr></thead>
        <tbody>{r.vm.layout.rows.map((row) => (
          <tr key={row.step.key}><th style={{ border: "1px solid #999", padding: 4 }}>{row.step.number}</th>
            {r.vm.layout.lanes.map((l) => <td key={l.key} style={{ border: "1px solid #999", textAlign: "center" }}>{row.lanes.includes(l.key) ? "●" : ""}</td>)}
          </tr>
        ))}</tbody>
      </table>
    ) : <pre>{JSON.stringify(r.state)}</pre>;
  } else if (view === "seq") {
    const r = await loadPage("sequence", project, { step });
    if (r.ok) {
      const l = r.vm.layout;
      const xOf = (k: string | null) => l.participants.find((p) => p.key === k)?.x ?? null;
      body = (
        <svg viewBox={`0 0 ${l.width} ${l.height}`} width="100%" style={{ maxHeight: "80vh" }}>
          {l.participants.map((p) => (
            <g key={p.key}>
              <line x1={p.x} x2={p.x} y1={40} y2={l.height - 10} stroke="#aaa" />
              <text x={p.x} y={30} textAnchor="middle" fontSize={13} fill={text}>{p.key}</text>
            </g>
          ))}
          {l.messages.map((m) => {
            const a = xOf(m.from), b = xOf(m.to);
            return (
              <g key={m.key}>
                {a !== null && b !== null && <line x1={a} x2={b} y1={m.y} y2={m.y} stroke={line} strokeWidth={2} />}
                <text x={((a ?? b ?? 0) + (b ?? a ?? 0)) / 2} y={m.y - 6} textAnchor="middle" fontSize={12} fill={text}>{m.order}. {m.key}</text>
              </g>
            );
          })}
        </svg>
      );
    } else body = <pre>{JSON.stringify(r.state)}</pre>;
  } else {
    const r = await loadPage("web", project);
    if (r.ok) {
      const l = r.vm.layout;
      const at = new Map(l.nodes.map((n) => [n.key, n]));
      body = (
        <svg viewBox={`0 0 ${l.width} ${l.height}`} width="100%" style={{ maxHeight: "80vh" }}>
          {l.edges.map((e) => { const a = at.get(e.from), b = at.get(e.to); return a && b ? <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ccc" /> : null; })}
          {l.nodes.map((n) => { const s = nodeBox(n.title); return (
            <g key={n.key}>
              <rect x={n.x - s.w / 2} y={n.y - s.h / 2} width={s.w} height={s.h} fill={n.stuck ? "#fee" : box} stroke={stroke} rx={4} />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11} fill={text}>{n.key}</text>
            </g>
          ); })}
        </svg>
      );
    } else body = <pre>{JSON.stringify(r.state)}</pre>;
  }
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
      <p data-probe="view">{view} · {project}</p>
      {body}
    </main>
  );
}
