// A participant kind's mark: its own shape in its own colour (● ■ ◆ ▲), so a kind is never told by colour alone.
import { kinds, type Kind } from "../tokens";

export function KindMark({ kind, size = 14 }: { kind: Kind; size?: number }) {
  const { shape, color } = kinds[kind];
  return (
    <svg className="lg-kindmark" width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      {shape === "circle" && <circle cx="7" cy="7" r="6" fill={color} />}
      {shape === "square" && <rect x="1.5" y="1.5" width="11" height="11" rx="2" fill={color} />}
      {shape === "diamond" && <path d="M7 0.5 13.5 7 7 13.5 0.5 7Z" fill={color} />}
      {shape === "triangle" && <path d="M7 1 13.5 13 0.5 13Z" fill={color} />}
    </svg>
  );
}
