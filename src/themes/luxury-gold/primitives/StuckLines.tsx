// A stuck part's wordings, one line each — never joined into one sentence (REVIEW-A-002 row 2, direction § 2 [5]).
export function StuckLines({ wordings }: { wordings: readonly string[] }) {
  if (wordings.length === 0) return null;
  return (
    <ul className="lg-item-stuck">
      {wordings.map((w) => (
        <li key={w}>{w}</li>
      ))}
    </ul>
  );
}
