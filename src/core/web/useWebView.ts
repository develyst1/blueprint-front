"use client";

// The one zoom / pan / focus mechanism of the node web (REQ-009, SPEC-B-001 v1.14), shared by every theme: a theme renders its
// SVG (or HTML) inside an element carrying `style` from here, attaches `viewportRef` + `handlers` to the box that shows it,
// and draws its own controls that call `zoomIn` / `zoomOut` / `showAll`. It never computes a transform itself.
//
//  · opens on the whole web (`fitView`); moves to `focusView` when a node is chosen, back to the whole web when cleared
//  · buttons, wheel, pinch, drag, keys `+` `−` `0` (and arrows) — Escape clears the choice (`clearHref`, or `onClear`)
//  · `linkProps(href)` for every link that chooses or clears a node: a plain click is a client navigation, never a page load (SPEC v1.16)
//  · no animation under `prefers-reduced-motion`, nor while the user is dragging / pinching / using the wheel
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { fitView, focusView, panBy, pickLayout, zoomAt, type Box, type View } from "./view";

type Layout = Parameters<typeof fitView>[0] & { width: number; height: number };

const SSR_BOX: Box = { w: 960, h: 640 }; // the server renders (and hydration matches) a view for a plausible box; the first measurement snaps it
const STEP = 1.25;   // one press of + / −
const PAN_KEY = 60;  // one arrow key, screen px
const DRAG = 4;      // px of movement before a press becomes a drag (below it, it is a click on a node)
const MS = 200;      // animation length

export interface WebViewApi<L extends Layout = Layout> {
  /** Attach to the box that shows the web (it is measured; give it a fixed height and `overflow: hidden`, `touch-action: none`). */
  viewportRef: (el: HTMLElement | null) => void;
  /** Spread on the element (HTML or SVG `<g>`) that holds the whole web. */
  style: CSSProperties;
  /** Spread on the same box as `viewportRef`. */
  handlers: {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  };
  zoomIn: () => void;
  zoomOut: () => void;
  /** Spread on every link that chooses or clears a node (a node, a เชื่อมกับ entry, ดูทั้งหมด): `{ href, onClick }`. A plain left
   *  click on it is turned into a client navigation (`router.push(href, { scroll: false })`) — no document request, no scroll
   *  jump, this component stays mounted so the view glides to the new choice; the address still changes, so Back / Forward and a
   *  copied link work. Ctrl / ⌘ / Shift / Alt / middle clicks keep the browser's default (a new tab or window). */
  linkProps: (href: string) => { href: string; onClick: (e: MouseEvent<Element>) => void };
  /** ดูทั้งหมด: with a node chosen, leave the click alone (the link to `allHref` clears it); otherwise re-fit the whole web. */
  showAll: (e?: { preventDefault: () => void }) => void;
  /** The layout to draw: the wide one or `opts.tall`, whichever is shaped like the box (SPEC v1.15). Draw THIS, not the one you passed. */
  layout: L;
  scale: number;
  dragging: boolean;
}

export function useWebView<L extends Layout>(wide: L, selectedKey: string | null, opts: { clearHref?: string; onClear?: () => void; tall?: L } = {}): WebViewApi<L> {
  const router = useRouter();
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<Box>(SSR_BOX);
  const [measured, setMeasured] = useState(false);
  // Which arrangement is drawn is decided on the first measurement and whenever the WINDOW's own size changed — never because the
  // page narrowed the box around a choice (a side panel): then the arrangement is kept and the view glides (SPEC v1.17, REQ-009 DEF-3).
  const [shape, setShape] = useState<"wide" | "tall">("wide"); // the server draws the wide one (and hydration matches); the first measurement picks
  const lastWindow = useRef<Box | null>(null);
  const layout = shape === "tall" && opts.tall ? opts.tall : wide;
  const [view, setView] = useState<View>(() => (selectedKey ? focusView(layout, selectedKey, SSR_BOX) : fitView(layout, SSR_BOX)));
  const [smooth, setSmooth] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [dragging, setDragging] = useState(false);

  const touched = useRef(false);          // the user has moved the view since it was last set by the page
  const didInit = useRef(false);
  const lastKey = useRef(selectedKey);
  const lastShape = useRef(shape);
  const suppressClick = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const pinch = useRef<number | null>(null);
  const latest = useRef({ box, view, layout, selectedKey, onClear: opts.onClear, clearHref: opts.clearHref });
  latest.current = { box, view, layout, selectedKey, onClear: opts.onClear, clearHref: opts.clearHref };
  /** Clear the choice: through the same in-page navigation as a link (`clearHref`), else the theme's own `onClear`. */
  const clear = () => { const { clearHref, onClear } = latest.current; if (clearHref) router.push(clearHref, { scroll: false }); else onClear?.(); };

  const base = useCallback((b: Box) => (selectedKey ? focusView(layout, selectedKey, b) : fitView(layout, b)), [layout, selectedKey]);

  // measure the box
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect(), next = { w: r.width, h: r.height };
      const win = { w: window.innerWidth, h: window.innerHeight }, before = lastWindow.current;
      if (!before || before.w !== win.w || before.h !== win.h) { // the first measurement, or the window itself changed
        lastWindow.current = win;
        setShape(opts.tall && pickLayout(wide, opts.tall, next) === opts.tall ? "tall" : "wide");
      }
      setBox(next);
      setMeasured(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);

  // reduced motion
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);

  // the page decides the view: once it is measured, the whole web (or the chosen node); a new choice animates there; a resize
  // keeps what the user did, unless they have not touched it
  useEffect(() => {
    if (!measured) return;
    // the first measurement, or the box changed shape so the other layout is drawn (its coordinates differ): start over, no animation
    if (!didInit.current || lastShape.current !== shape) { didInit.current = true; lastShape.current = shape; lastKey.current = selectedKey; touched.current = false; setSmooth(false); setView(base(box)); return; }
    if (selectedKey !== lastKey.current) { lastKey.current = selectedKey; touched.current = false; setSmooth(true); setView(base(box)); return; }
    if (!touched.current) setView(base(box)); // keeps `smooth`: a box that narrows as a choice lands (clean-blue's side card) glides on (TASK-B-036)
  }, [measured, box, selectedKey, base, shape]);

  const move = useCallback((next: (v: View) => View, animated: boolean) => { touched.current = true; setSmooth(animated); setView(next); }, []);
  const zoom = useCallback((factor: number, at?: { x: number; y: number }, animated = true) => {
    const b = latest.current.box;
    move((v) => zoomAt(v, factor, at?.x ?? b.w / 2, at?.y ?? b.h / 2), animated);
  }, [move]);

  // the wheel zooms about the pointer (a native listener: React's own wheel handlers are passive and cannot stop the page scrolling)
  useEffect(() => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), { x: e.clientX - r.left, y: e.clientY - r.top }, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [el, zoom]);

  const rel = (e: { clientX: number; clientY: number }) => { const r = el!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const dist = () => { const [a, b] = [...pointers.current.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; };

  const handlers: WebViewApi["handlers"] = {
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) { pinch.current = dist(); drag.current = null; suppressClick.current = true; }
      else drag.current = { x: e.clientX, y: e.clientY, view: latest.current.view, moved: false };
    },
    onPointerMove: (e) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2 && pinch.current) {
        const d = dist(), [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
        zoom(d / pinch.current, rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }), false);
        pinch.current = d;
        return;
      }
      const s = drag.current;
      if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (!s.moved && Math.hypot(dx, dy) < DRAG) return;
      if (!s.moved) { s.moved = true; setDragging(true); try { el?.setPointerCapture(e.pointerId); } catch { /* not capturable: the drag still works inside the box */ } }
      move(() => panBy(s.view, dx, dy), false);
    },
    onPointerUp: (e) => {
      pointers.current.delete(e.pointerId);
      if (drag.current?.moved) { suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0); }
      if (pointers.current.size < 2) { if (pinch.current) setTimeout(() => { suppressClick.current = false; }, 0); pinch.current = null; }
      if (pointers.current.size === 0) { drag.current = null; setDragging(false); }
    },
    onPointerCancel: (e) => handlers.onPointerUp(e),
    // a drag that ends on a node must not follow its link
    onClickCapture: (e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); } },
    onKeyDown: (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      if (key === "+" || key === "=") zoom(STEP);
      else if (key === "-" || key === "_") zoom(1 / STEP);
      else if (key === "0") api.showAll();
      else if (key === "Escape") { if (latest.current.selectedKey) clear(); else api.showAll(); }
      else if (key === "ArrowLeft") move((v) => panBy(v, PAN_KEY, 0), true);
      else if (key === "ArrowRight") move((v) => panBy(v, -PAN_KEY, 0), true);
      else if (key === "ArrowUp") move((v) => panBy(v, 0, PAN_KEY), true);
      else if (key === "ArrowDown") move((v) => panBy(v, 0, -PAN_KEY), true);
      else return;
      e.preventDefault();
    },
  };

  const api: WebViewApi<L> = {
    viewportRef: setEl,
    style: {
      transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
      transformOrigin: "0 0",
      transition: smooth && !reduced && !dragging ? `transform ${MS}ms ease` : "none",
    },
    handlers,
    zoomIn: () => zoom(STEP),
    zoomOut: () => zoom(1 / STEP),
    linkProps: (href) => ({
      href,
      onClick: (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // the browser's own: a new tab, a download…
        e.preventDefault();
        router.push(href, { scroll: false });
      },
    }),
    showAll: (e) => {
      const { selectedKey: chosen, layout: l, box: b } = latest.current;
      if (chosen) { if (!e) clear(); return; } // the link to allHref (through `linkProps`) clears the choice, and the page re-fits
      e?.preventDefault();
      touched.current = false;
      setSmooth(true);
      setView(fitView(l, b));
    },
    layout,
    scale: view.scale,
    dragging,
  };
  return api;
}
