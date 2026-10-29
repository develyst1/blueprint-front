// The change-set body for one requirement step (REQ-103, SPEC-104 § Requirement part kind). Pure — the server actions
// (src/app/actions.ts) send it, the unit tests read it. A requirement is a spec part written by hand through the existing
// POST …/change-sets: `cause: operator`, the stamp `operator` (the PM at the keyboard), today's date in Bangkok.
// The AI never writes one (SPEC-104 D6).
export type RequirementStep =
  | { op: "add"; title: string; text: string }
  | { op: "update"; key: string; title: string; text: string }
  | { op: "remove"; key: string };

/** Bangkok's calendar day as YYYY-MM-DD — the `origin.date` the back end wants. */
export const bangkokToday = (now: Date = new Date()): string => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);

export function requirementChange(step: RequirementStep, now: Date = new Date()): { cause: { kind: "operator" }; changes: unknown[] } {
  const cause = { kind: "operator" as const };
  const origin = { stamp: "operator", date: bangkokToday(now) };
  if (step.op === "add") {
    return { cause, changes: [{ op: "part.add", ref: "$r", kind: "requirement", title: step.title, body: { text: step.text }, origin }] };
  }
  if (step.op === "update") {
    return { cause, changes: [{ op: "part.update", key: step.key, title: step.title, body: { text: step.text }, origin }] };
  }
  return { cause, changes: [{ op: "part.remove", key: step.key }] };
}
