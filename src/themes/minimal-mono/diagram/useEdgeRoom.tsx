"use client";

// Room at a diagram's edges for what is drawn around the core's positions (labels, rings, hit circles): the
// content group is measured after layout and the viewBox grows by exactly what sticks out, plus a small gap.
// Positions are never moved — only the canvas around them grows (TASK-A-021 R1: a cut label is a dropped label).
import { useLayoutEffect, useRef, useState, type DependencyList } from "react";

export type EdgeRoom = { left: number; top: number; right: number; bottom: number };
const NONE: EdgeRoom = { left: 0, top: 0, right: 0, bottom: 0 };
const GAP = 6;

export function useEdgeRoom(width: number, height: number, deps: DependencyList) {
  const content = useRef<SVGGElement>(null);
  const [room, setRoom] = useState<EdgeRoom>(NONE);
  useLayoutEffect(() => {
    const g = content.current;
    if (!g) return;
    const bb = g.getBBox();
    const next = {
      left: Math.ceil(Math.max(0, -bb.x) + (bb.x < 0 ? GAP : 0)),
      top: Math.ceil(Math.max(0, -bb.y) + (bb.y < 0 ? GAP : 0)),
      right: Math.ceil(Math.max(0, bb.x + bb.width - width) + (bb.x + bb.width > width ? GAP : 0)),
      bottom: Math.ceil(Math.max(0, bb.y + bb.height - height) + (bb.y + bb.height > height ? GAP : 0)),
    };
    setRoom((prev) => (prev.left === next.left && prev.top === next.top && prev.right === next.right && prev.bottom === next.bottom ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, ...deps]);
  const svgProps = {
    width: width + room.left + room.right,
    height: height + room.top + room.bottom,
    viewBox: `${-room.left} ${-room.top} ${width + room.left + room.right} ${height + room.top + room.bottom}`,
  };
  return { content, room, svgProps };
}
