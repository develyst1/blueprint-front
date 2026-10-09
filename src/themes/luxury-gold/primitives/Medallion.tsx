// A step medallion: a navy circle with its serif numeral and the step title under it.
// End step = a quiet navy ring + words.stepEnds beside it (visible and read — the ring alone is never the signal).
// Stuck = the scalloped seal on its shoulder + the stuck words for screen readers (never the fill alone).
// Interactive use: render it inside a trigger (e.g. Popover.Trigger), or with `asButton`.
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { stepEnds } from "@/core/words";
import { color, medallion } from "../tokens";
import { Seal } from "./Seal";

type MedallionProps = {
  /** The step number as the view model gives it ("01"), or a plain number. */
  number: string | number;
  title: string;
  end?: boolean;
  /** The step's stuck wordings (StepVM.stuckWordings) when it is stuck; undefined when it is not. Never joined into one
   *  sentence: one line each on screen, "; " between them for screen readers (REVIEW-A-002 row 2). */
  stuck?: readonly string[];
  /** Smaller medallion (the new-project preview). */
  small?: boolean;
  /** e.g. the required-content marker (requiredProps) — put on the visible title. */
  titleProps?: Record<string, string>;
  /** Show the stuck words on screen under the title (overview) instead of for screen readers only. */
  stuckVisible?: boolean;
  /** Render as a button (for a detail popover). */
  asButton?: boolean;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "title">;

export const Medallion = forwardRef<HTMLButtonElement, MedallionProps>(function Medallion(
  { number, title, end = false, stuck, small = false, titleProps, stuckVisible = false, asButton = false, ...rest },
  ref,
) {
  const r = small ? 20 : medallion.r;
  const box = r * 2 + 8;
  const numeral = typeof number === "number" ? String(number).padStart(2, "0") : number;
  const art = (
    <>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
        {end ? (
          <circle cx={box / 2} cy={box / 2} r={r} fill={color.surface} stroke={color.navy} strokeWidth={medallion.endRing} />
        ) : (
          <circle cx={box / 2} cy={box / 2} r={r} fill={color.navy} />
        )}
        <text
          className="lg-medallion-num"
          x={box / 2}
          y={box / 2 + (small ? 5 : 7)}
          textAnchor="middle"
          fontSize={small ? 15 : 20}
          fill={end ? color.navy : color.onNavy}
        >
          {numeral}
        </text>
      </svg>
      {stuck && (
        <span className="lg-medallion-seal" data-small={small || undefined}>
          <Seal size={small ? 18 : 22} />
        </span>
      )}
      <span className="lg-medallion-title" {...titleProps}>
        {title}
      </span>
      {end && <span className="lg-medallion-end">{stepEnds}</span>}
      {stuck && stuck.length > 0 &&
        (stuckVisible ? (
          <span className="lg-medallion-stuck">
            {/* The hidden "; " makes a screen reader pause between wordings inside the card's link name. */}
            {stuck.map((w) => (
              <span key={w} className="lg-stuck-line">
                <span className="lg-sr-only">; </span>
                {w}
              </span>
            ))}
          </span>
        ) : (
          <span className="lg-sr-only">{stuck.join("; ")}</span>
        ))}
    </>
  );
  return asButton ? (
    <button ref={ref} type="button" className="lg-medallion" data-small={small || undefined} {...rest}>
      {art}
    </button>
  ) : (
    <span className="lg-medallion" data-small={small || undefined}>
      {art}
    </span>
  );
});
