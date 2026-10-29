"use client";

// The requirements page's editor (REQ-103 AC-4): add, edit and remove a requirement by hand. Each step is one server
// action (src/app/actions.ts → POST …/change-sets); the page refreshes after it, so the list is the back end's, not a
// local guess. With no typed name an action answers `name_required` and the page re-renders with the name field open.
// Words: only the PM's (REQ-103 § Wording) and words the desk already has — ลบ, แก้, เพิ่ม, ยกเลิก (TASK-108 Q1).
import { useState, useTransition, type FormEvent } from "react";
import { addRequirementAction, removeRequirementAction, updateRequirementAction, type RequirementResult } from "@/app/actions";
import type { RequirementVM } from "@/core/theme/contract";
import { Mark } from "@/core/theme/default/Mark";
import { addRequirement, apiDown, emptyRequirements, historyWhat, newProjectSteps, pageLabel } from "@/core/words";
import { cancel } from "@/features/chat/words";
import type { RequiredItem } from "@/core/theme/contract";
import { requiredId } from "@/core/theme/required";
import s from "./requirements.module.css";

type Form = { key: string | null; title: string; text: string } | null;

export function RequirementsEditor({ projectId, requirements, required }: { projectId: string; requirements: RequirementVM[]; required: RequiredItem[] }) {
  const [form, setForm] = useState<Form>(null);
  const [failed, setFailed] = useState(false);
  const [busy, start] = useTransition();

  const run = (call: () => Promise<RequirementResult>, done?: () => void) => start(async () => {
    const r = await call();
    // `name_required`: the action refreshed the page, which now shows the open name field; nothing was sent
    setFailed(!r.ok && r.code !== "name_required");
    if (r.ok) done?.();
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form || !form.title.trim() || !form.text.trim() || busy) return;
    const f = form;
    run(() => (f.key ? updateRequirementAction(projectId, f.key, f.title, f.text) : addRequirementAction(projectId, f.title, f.text)), () => setForm(null));
  };

  return (
    <>
      {requirements.length === 0 && form === null && <p>{emptyRequirements}</p>}
      <ul className={s.list}>
        {requirements.map((r) => (
          <li key={r.key} className={s.item}>
            <h3 className={s.title}><Mark required={required} id={requiredId.part(r.key)}>{r.title}</Mark></h3>
            <p className={s.text}>{r.text}</p>
            <div className={s.row}>
              <button type="button" className={s.button} disabled={busy} onClick={() => setForm({ key: r.key, title: r.title, text: r.text })}>{historyWhat.update}</button>
              <button type="button" className={s.button} disabled={busy} onClick={() => run(() => removeRequirementAction(projectId, r.key))}>{historyWhat.remove}</button>
            </div>
          </li>
        ))}
      </ul>
      {form === null ? (
        <button type="button" className={s.button} onClick={() => setForm({ key: null, title: "", text: "" })}>{addRequirement}</button>
      ) : (
        <form className={s.form} onSubmit={submit}>
          <label className={s.label}>
            <span>{newProjectSteps[0]}</span>
            <input className={s.field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} autoFocus />
          </label>
          <label className={s.label}>
            <span>{pageLabel.requirements}</span>
            <textarea className={s.field} rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} maxLength={4000} />
          </label>
          <div className={s.row}>
            <button type="submit" className={s.button} disabled={busy || !form.title.trim() || !form.text.trim()}>{form.key ? historyWhat.update : historyWhat.add}</button>
            <button type="button" className={s.button} disabled={busy} onClick={() => setForm(null)}>{cancel}</button>
          </div>
        </form>
      )}
      {failed && <p role="alert">{apiDown}</p>}
    </>
  );
}
