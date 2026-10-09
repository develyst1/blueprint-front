"use client";

// words.showMore: long text lives behind this click, never on first open (REQ-002 AC-8).
// Required items are never put inside it (SPEC-B-001 "visible").
import { Disclosure } from "@heroui/react";
import { useState, type ReactNode } from "react";
import { showMore } from "@/core/words";

export function MoreDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Disclosure isExpanded={open} onExpandedChange={setOpen} className="lg-more">
      <Disclosure.Heading>
        <Disclosure.Trigger className="lg-more-trigger">
          {showMore}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="lg-more-body">{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}
