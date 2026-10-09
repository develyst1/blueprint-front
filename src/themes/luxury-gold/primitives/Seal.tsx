"use client";

// The stuck seal: a scalloped wine seal with a white "!" — stuck is shown by shape, never by fill alone
// (wine vs the navy medallion is only 1.67:1, direction § 3). Readiness: the seal + a chip carrying the view model's label.
import { Chip } from "@heroui/react";
import { color } from "../tokens";

function scallopPath(cx: number, cy: number, r: number, bumps = 12): string {
  const step = (Math.PI * 2) / bumps;
  const inner = r * 0.86;
  let d = "";
  for (let i = 0; i < bumps; i++) {
    const a0 = i * step - Math.PI / 2;
    const a1 = a0 + step;
    const am = a0 + step / 2;
    const p0 = [cx + inner * Math.cos(a0), cy + inner * Math.sin(a0)];
    const pm = [cx + r * 1.08 * Math.cos(am), cy + r * 1.08 * Math.sin(am)];
    const p1 = [cx + inner * Math.cos(a1), cy + inner * Math.sin(a1)];
    d += `${i === 0 ? `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}` : ""}Q${pm[0].toFixed(2)} ${pm[1].toFixed(2)} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  }
  return d + "Z";
}

/** The seal alone. `label` is what a screen reader hears (the stuck wording); the seal itself is drawn. */
export function Seal({ size = 22, label }: { size?: number; label?: string }) {
  const c = size / 2;
  return (
    <svg
      className="lg-seal"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={scallopPath(c, c, c * 0.92)} fill={color.stuck} />
      <text
        x={c}
        y={c + size * 0.2}
        textAnchor="middle"
        fontSize={size * 0.58}
        fontWeight={700}
        fill={color.onStuck}
        aria-hidden="true"
      >
        !
      </text>
    </svg>
  );
}

/**
 * Readiness: the seal (when stuck) and a chip with the label the view model already worded
 * (words.readinessStuck(n) / words.readinessClean / emptyProject). No meter — no ratio exists (TASK-C-003 Q1).
 * Props mirror ReadinessVM { stuckCount, label, ready }. The stuck look (seal, wine) keys on `stuckCount > 0`, never on
 * `ready`: an empty project is not ready and has nothing stuck, and is drawn neutral with its label only (SA-B's style
 * rule, D-015, TASK-C-008 item 6c).
 */
export function Readiness({
  stuckCount,
  label,
  labelProps,
}: {
  stuckCount: number;
  label: string;
  ready: boolean;
  /** e.g. the required-content marker (requiredProps) — put on the element whose text is the label. */
  labelProps?: Record<string, string>;
}) {
  const stuck = stuckCount > 0;
  return (
    <div className="lg-readiness">
      <Chip variant="soft" color={stuck ? "danger" : "default"} size="md">
        <span className="lg-readiness-chip" data-stuck={stuck} data-stuck-count={stuckCount} {...labelProps}>
          {stuck && <Seal size={18} />}
          {label}
        </span>
      </Chip>
    </div>
  );
}
