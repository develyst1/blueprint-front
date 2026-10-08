// Data helpers shared by the three theme mockups (TASK-B-001). No look, no layout:
// every theme decides how to draw what these return. Reads only window.BLUEPRINT_MOCK.
(function () {
  const D = window.BLUEPRINT_MOCK;
  const parts = D.project.parts;
  const links = D.project.links;
  const partByKey = new Map(parts.map((p) => [p.key, p]));

  // Wording from REQ-002 § "User-facing wording" — the only words a theme may add.
  const WORDS = {
    pages: ["ภาพรวม", "ลำดับงาน", "ผังการทำงาน", "ลำดับการโต้ตอบ", "หน้าจอ", "API", "ใยโหนด", "ติดอยู่ตรงไหน", "ประวัติ"],
    stuck: (n) => `ติดอยู่ ${n} จุด`,
    ready: "พร้อมสร้าง",
    showMore: "ดูรายละเอียด",
    stuckKinds: {
      open_question: "ยังมีคำถามที่ยังไม่ได้ตอบ",
      unlinked: "ส่วนนี้ยังไม่ได้เชื่อมกับอะไรเลย",
      unreachable: "ไปถึงขั้นนี้จากขั้นแรกไม่ได้",
      dead_end: "ขั้นนี้ไม่ไปต่อ และยังไม่ได้บอกว่าเป็นขั้นสุดท้าย",
      branch_without_condition: "ทางแยกนี้ยังไม่ได้บอกเงื่อนไข",
      step_without_participant: "ยังไม่รู้ว่าใครทำอะไรในขั้นนี้",
      interaction_missing_end: "ยังไม่รู้ว่าใครเป็นคนส่ง หรือใครเป็นคนรับ",
      unconfirmed_guess: "บอทเดาไว้ ยังไม่ได้รับการยืนยัน",
      screen_without_api: "หน้าจอนี้แสดงข้อมูล แต่ยังไม่รู้ว่าดึงมาจาก API ไหน",
    },
  };

  const byPosition = (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity);

  const work = parts.find((p) => p.kind === "work");
  const listed = D.projects.find((p) => p.id === D.project.project.id);

  // Steps in has_step order, each with its stuck flag and its participants (from the swimlane).
  const stuckItems = D.stuck.items.map((item) => {
    const about = links.find((l) => l.kind === "about" && l.fromKey === item.key);
    return { ...item, words: WORDS.stuckKinds[item.kind] ?? item.kind, aboutKey: about ? about.toKey : null };
  });
  const stuckSteps = new Set(stuckItems.map((i) => i.aboutKey).filter(Boolean));
  const laneOfRow = new Map(D.swimlane.rows.map((r) => [r.step.key, r.lanes]));
  const steps = links
    .filter((l) => l.kind === "has_step" && l.fromKey === work.key)
    .sort(byPosition)
    .map((l, i) => {
      const p = partByKey.get(l.toKey);
      return {
        key: p.key,
        number: String(i + 1).padStart(2, "0"),
        title: p.title,
        ends: !!p.body.ends,
        stuck: stuckSteps.has(p.key),
        lanes: laneOfRow.get(p.key) ?? [],
      };
    });

  // The decision whose long text sits behind "ดูรายละเอียด".
  const decisionPart = parts.find((p) => p.kind === "decision");
  const decision = decisionPart && {
    key: decisionPart.key,
    title: decisionPart.title,
    rule: decisionPart.body.rule,
    cases: decisionPart.body.cases ?? [],
    open: decisionPart.body.open ?? null,
    covers: links.filter((l) => l.kind === "covers" && l.fromKey === decisionPart.key).map((l) => l.toKey),
  };

  // Lane kinds in order of first appearance — themes map a kind to a colour or a shape.
  const laneKinds = [...new Set(D.swimlane.lanes.map((l) => l.kind))];

  // Flowchart layout: longest-path layers, long arrows get bend points in the layers they
  // cross, rows ordered by a backward barycentre sweep. Rows are centred on 0 per layer.
  function flowLayout() {
    const nodes = D.flowchart.nodes;
    const layer = new Map(nodes.map((n) => [n.key, 0]));
    for (let pass = 0; pass < nodes.length; pass++) {
      for (const a of D.flowchart.arrows) layer.set(a.to, Math.max(layer.get(a.to), layer.get(a.from) + 1));
    }
    const depth = Math.max(...layer.values()) + 1;
    const members = Array.from({ length: depth }, () => []);
    const succ = new Map();
    const pos = new Map(nodes.map((n) => [n.key, n.position ?? Infinity]));
    nodes.forEach((n) => members[layer.get(n.key)].push(n.key));
    const chains = D.flowchart.arrows.map((a, ai) => {
      const chain = [a.from];
      for (let L = layer.get(a.from) + 1; L < layer.get(a.to); L++) {
        const id = `bend:${ai}:${L}`;
        members[L].push(id);
        pos.set(id, pos.get(a.to));
        chain.push(id);
      }
      chain.push(a.to);
      for (let i = 0; i < chain.length - 1; i++) {
        if (!succ.has(chain[i])) succ.set(chain[i], []);
        succ.get(chain[i]).push(chain[i + 1]);
      }
      return { arrow: a, chain };
    });
    members[depth - 1].sort((a, b) => pos.get(a) - pos.get(b));
    for (let L = depth - 2; L >= 0; L--) {
      const next = members[L + 1];
      const bary = (k) => {
        const s = (succ.get(k) ?? []).map((x) => next.indexOf(x)).filter((i) => i >= 0);
        return s.length ? s.reduce((x, y) => x + y, 0) / s.length : next.length + pos.get(k);
      };
      members[L].sort((a, b) => bary(a) - bary(b) || pos.get(a) - pos.get(b));
    }
    const place = new Map();
    members.forEach((m, L) => m.forEach((k, i) => place.set(k, { layer: L, row: i - (m.length - 1) / 2 })));
    return {
      depth,
      maxRows: Math.max(...members.map((m) => m.length)),
      nodes: nodes.map((n) => ({ ...n, ...place.get(n.key), stuck: stuckSteps.has(n.key) })),
      edges: chains.map(({ arrow, chain }) => ({ ...arrow, points: chain.map((k) => place.get(k)) })),
    };
  }

  // Every arrow as one line of text (data words only) — the screen-reader version of the flowchart.
  function arrowLines() {
    const label = (key) => {
      const s = steps.find((x) => x.key === key);
      return s ? `${s.number} ${s.title}` : partByKey.get(key)?.title ?? key;
    };
    return D.flowchart.arrows.map((a) => `${label(a.from)} → ${label(a.to)}${a.label ? ` · ${a.label}` : ""}`);
  }

  // Tiny DOM builder — text always goes in through textContent.
  function el(tag, attrs = {}, ...children) {
    const svg = ["svg", "g", "path", "rect", "circle", "line", "text", "tspan", "polygon", "title", "defs", "marker", "ellipse"];
    const node = svg.includes(tag)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "text") node.textContent = v;
      else if (k === "on") Object.entries(v).forEach(([ev, fn]) => node.addEventListener(ev, fn));
      else node.setAttribute(k, v === true ? "" : v);
    }
    children.flat().forEach((c) => c != null && node.append(c));
    return node;
  }

  window.BP = {
    WORDS,
    projectName: D.project.project.name,
    createdAt: D.project.project.createdAt,
    stuckCount: stuckItems.length, // TASK-B-001: count = stuck.items.length (agrees with the list's stuckCount)
    listedStuckCount: listed ? listed.stuckCount : null,
    steps,
    stuckItems,
    decision,
    swimlane: D.swimlane,
    laneKinds,
    flowLayout,
    arrowLines,
    partTitle: (key) => partByKey.get(key)?.title ?? key,
    el,
  };
})();
