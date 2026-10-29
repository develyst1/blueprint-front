"use client";

// The name control (REQ-103 AC-6, SPEC-104 § Front): shows who is typing, or asks for the name first. With no name the
// field is open and says the prompt — every change is recorded with it; no change is saved without one (the server
// actions refuse and the page re-renders into this open state). Not a login: typed, not verified.
// The words are the PM's only: the prompt. A save button word is not in REQ-103, so the submit is Enter or the "✓" mark,
// both named by the prompt (TASK-108 Q1). Neutral default style (zero specificity) so a theme's rules win.
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { BY_MAX, byCookie } from "./cookie";
import { changeName, nameButtonText, namePrompt } from "@/core/words";
import s from "./nameControl.module.css";

export function NameControl({ name }: { name: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name ?? "");
  const input = useRef<HTMLInputElement>(null);
  const open = name === null || editing;

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v || v.length > BY_MAX) return;
    document.cookie = byCookie(v);
    setEditing(false);
    router.refresh();
  };

  if (!open) {
    return (
      <span className={s.root}>
        {/* AC-11: "{ชื่อ} · เปลี่ยนชื่อ". On a phone the NAME part is capped with an ellipsis (CSS) so the tools keep one row; the
            full text stays in `title` and `aria-label`. */}
        <button type="button" className={s.button} title={nameButtonText(name)} aria-label={nameButtonText(name)}
          onClick={() => { setText(name ?? ""); setEditing(true); setTimeout(() => input.current?.focus(), 0); }}>
          <span className={s.nameText}>{name}</span>{" · "}{changeName}
        </button>
      </span>
    );
  }
  return (
    <form className={s.root} onSubmit={save} data-name-prompt={name === null ? "" : undefined}>
      <input
        ref={input}
        className={s.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={namePrompt}
        aria-label={namePrompt}
        maxLength={BY_MAX}
        autoComplete="off"
      />
      <button type="submit" className={s.button} aria-label={namePrompt} disabled={!text.trim()}>✓</button>
    </form>
  );
}
