"use client";

// The chat's quiet edge in luxury gold (REQ-004 R1, R4, R5) — after the minutes in DOM order; at 1440 under the pack in
// the right column: `toSpec` · the sources, each a name + a HeroUI Chip with its state in words · the model (HeroUI
// Select — its listbox portals into the theme root through ThemeRoot's provider) · creativity (HeroUI Slider, sent
// when the thumb is let go).
import { Chip, Label, ListBox, Select, Slider } from "@heroui/react";
import { useEffect, useState, type Ref } from "react";
import type { ChatActions, ChatVM } from "@/core/theme/contract";
import { creativityLabel, modelLabel, sourceFailed, sourceState, toSpec } from "@/features/chat/words";
import type { Run } from "./ChatDesk";

export function ChatEdge({ vm, actions, run, busy, reading, modelRef }: {
  vm: ChatVM; actions: ChatActions; run: Run; busy: boolean; reading: string | null; modelRef: Ref<HTMLButtonElement>;
}) {
  const [creativity, setCreativity] = useState(vm.creativity);
  useEffect(() => setCreativity(vm.creativity), [vm.creativity]);
  return (
    <aside className="lg-chat-edge">
      <a className="lg-chat-spec" href={vm.specHref}>{toSpec}</a>
      {(vm.sources.length > 0 || reading) && (
        <ul className="lg-chat-sources">
          {reading && (
            <li>
              <span className="lg-chat-source-name">{reading}</span>
              <Chip size="sm" variant="soft">{sourceState.reading}</Chip>
            </li>
          )}
          {vm.sources.map((src) => (
            <li key={src.id} data-state={src.state}>
              <span className="lg-chat-source-name">{src.name}</span>
              {/* the state in words; a reason code is never shown — an unknown one reads as the bare failed word */}
              <Chip size="sm" variant="soft" color={src.state === "failed" ? "danger" : "default"}>
                {src.state === "read" ? sourceState.read : sourceFailed(src.reason)}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      {vm.model && (
        <Select
          className="lg-chat-select"
          value={vm.model.current}
          isDisabled={busy}
          onChange={(key) => { if (key != null && key !== vm.model!.current) run(() => actions.setModel(String(key))); }}
        >
          <Label className="lg-group-title">{modelLabel}</Label>
          <Select.Trigger ref={modelRef}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {vm.model.options.map((o) => (
                <ListBox.Item key={o.value} id={o.value} textValue={o.label}>{o.label}</ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}
      <Slider
        className="lg-chat-slider"
        minValue={0}
        maxValue={2}
        step={0.1}
        value={creativity}
        isDisabled={busy}
        formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        onChange={(v) => setCreativity(v as number)}
        onChangeEnd={(v) => { if (v !== vm.creativity) run(() => actions.setCreativity(v as number)); }}
      >
        <div className="lg-chat-slider-head">
          <Label className="lg-group-title">{creativityLabel}</Label>
          <Slider.Output />
        </div>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </aside>
  );
}
