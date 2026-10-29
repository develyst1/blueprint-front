"use client";

// The label section (REQ-103): "ใส่ป้าย version" and its field, the warning before saving, and the label list. It replaces
// the confirm button on screen ④. Core-owned and neutral (zero-specificity CSS): every theme's ready page places it where
// the confirm button was, and the core hands it over as `labelSection` — a theme never builds it.
// A label is never blocked (AC-1): the warning only informs. An empty or whitespace-only text shows `emptyLabel` and sends
// nothing (AC-7). With no typed name the action answers `name_required` and the page re-renders with the name field open.
import { useId, useState, useTransition, type FormEvent } from "react";
import { apiDown } from "@/core/words";
import { requiredProps } from "@/core/theme/required";
import type { RequiredItem } from "@/core/theme/contract";
import type { ReadyActions, ReadyLabelVM } from "./contract";
import { readyRequiredId } from "./required";
import { emptyLabel, labelButton, labelPlaceholder } from "./words";
import s from "./labelSection.module.css";

export const LABEL_MAX = 80;

export function LabelSection({ warning, labels, label, required }: {
  warning: string | null; labels: ReadyLabelVM[]; label: ReadyActions["label"]; required: RequiredItem[];
}) {
  const ids = { warning: useId(), error: useId() };
  const [text, setText] = useState("");
  const [error, setError] = useState<"empty" | "failed" | null>(null);
  const [busy, start] = useTransition();
  const warningItem = required.find((r) => r.id === readyRequiredId.warning);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = text.trim();
    if (!v) { setError("empty"); return; }
    setError(null);
    start(async () => {
      const r = await label(v);
      if (r.ok) setText("");
      else if (r.code !== "name_required") setError("failed");
    });
  };

  return (
    <section className={s.root} aria-label={labelButton}>
      {warning && <p id={ids.warning} className={s.warning} {...(warningItem ? requiredProps(warningItem) : {})}>{warning}</p>}
      <form className={s.form} onSubmit={submit} noValidate>
        <input
          className={s.input}
          value={text}
          onChange={(e) => { setText(e.target.value); if (error === "empty") setError(null); }}
          placeholder={labelPlaceholder}
          aria-label={labelPlaceholder}
          aria-describedby={[warning ? ids.warning : null, error ? ids.error : null].filter(Boolean).join(" ") || undefined}
          aria-invalid={error === "empty" || undefined}
          maxLength={LABEL_MAX}
          disabled={busy}
        />
        <button type="submit" className={s.button} disabled={busy}>{labelButton}</button>
      </form>
      {error && <p id={ids.error} className={s.error} role="alert">{error === "empty" ? emptyLabel : apiDown}</p>}
      {labels.length > 0 && (
        <ul className={s.list} aria-label={labelButton}>
          {labels.map((l) => (
            <li key={`${l.version}`} className={s.item} data-label-version={l.version}>
              <span className={s.text}>{l.text}</span>
              <span>{l.dateLabel}</span>
              <span>{l.by}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
