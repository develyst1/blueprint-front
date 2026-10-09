"use client";

// The new-project dialog (R2, AC-5): ตั้งชื่อ → เลือกธีม (each theme's own preview, live) → สร้าง.
// A native <dialog> in the core's own subtree — never portaled into a theme root (SPEC-B-001).
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { createProjectAction } from "@/app/actions";
import { chatHref } from "@/core/model/build/common";
import { apiDown, newProject, newProjectSteps } from "@/core/words";
import s from "./home.module.css";

export type ThemeOption = { id: string; name: string; preview: ReactNode };

export function NewProject({ themes }: { themes: ThemeOption[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState(themes[0]?.id ?? "default");
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const step = name.trim() ? 1 : 0;

  const close = () => { dialog.current?.close(); setName(""); setFailed(false); };
  // a new project starts in the chat (REQ-004 R1, AC-1)
  const create = () => start(async () => {
    const res = await createProjectAction(name, theme);
    if (res.ok) { close(); router.push(chatHref(res.id)); }
    else setFailed(true);
  });

  return (
    <>
      <button type="button" className={s.button} onClick={() => dialog.current?.showModal()}>{newProject}</button>
      <dialog ref={dialog} className={s.dialog} aria-label={newProject} onClose={() => setFailed(false)}>
        <ol className={s.steps}>
          {newProjectSteps.map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined}>{label}</li>)}
        </ol>
        <label className={s.field}>
          <span>{newProjectSteps[0]}</span>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <fieldset className={s.themes}>
          <legend>{newProjectSteps[1]}</legend>
          {themes.map((t) => (
            <label key={t.id} className={s.option}>
              <span><input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => setTheme(t.id)} /> {t.name}</span>
              {t.preview}
            </label>
          ))}
        </fieldset>
        {failed && <p className={s.error} role="alert">{apiDown}</p>}
        <div className={s.actions}>
          <button type="button" className={s.button} disabled={!name.trim() || pending} onClick={create}>{newProjectSteps[2]}</button>
        </div>
      </dialog>
    </>
  );
}
