"use client";

// ดูรายละเอียด for minimal mono, shared by the card pages (TASK-A-022): an outline button in both states (the stuck
// part stays the page's only solid block), a chevron that turns, aria-expanded/-controls, and a Mantine Collapse
// whose closed content is out of the tab order.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import { Button, Collapse } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { useId, useState, type ReactNode } from "react";
import { showMore } from "@/core/words";
import s from "./parts.module.css";

/** describedBy: the id of the card title, so each ดูรายละเอียด says whose details it opens. */
export function Disclosure({ children, describedBy }: { children: ReactNode; describedBy?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <Button
        variant="default"
        radius="md"
        h={44}
        className={s.moreButton}
        rightSection={<IconChevronDown size={18} aria-hidden="true" className={open ? s.chevronOpen : undefined} />}
        aria-expanded={open}
        aria-controls={id}
        aria-describedby={describedBy}
        onClick={() => setOpen((v) => !v)}
      >
        {showMore}
      </Button>
      <Collapse expanded={open} id={id}>
        {children}
      </Collapse>
    </>
  );
}
