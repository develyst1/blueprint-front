"use client";

// minimal mono's page states (AC-14…16). A client file because the retry button calls state.retry — a server
// action handed down by the core (SPEC-B-001 § "Server/client split"). Words only from src/core/words.ts; the
// "back home" address is the core's (state.homeHref). Loading has no PageState — the core draws it.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Alert.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/Anchor.css";
import "@mantine/core/styles/Stack.css";
import { Alert, Anchor, Button, Paper, Stack, Text } from "@mantine/core";
import { useTransition } from "react";
import type { FrameVM, PageState, RequiredItem } from "@/core/theme/contract";
import { apiDown, backHome, emptyProject, notFound, retry } from "@/core/words";
import { StuckIcon } from "../parts/StuckIcon";
import { RequiredList } from "../parts/Required";
import { Shell } from "../shell/Shell";
import s from "./state.module.css";

// v1.2: `required` = the frame's own items (the readiness label on an empty page). With a frame (an empty project
// the core can read) the state sits inside the mono Shell — skip link, project name (h1), nav, readiness strip, which
// claims the readiness item — like every page (REVIEW-C-002 row 25). Without one, the items are short lines.
export function State({ frame, state, required = [] }: { frame: FrameVM | null; state: PageState; required?: RequiredItem[] }) {
  const [pending, start] = useTransition();

  if (state.kind === "unreachable") {
    return (
      <Alert variant="outline" radius="lg" icon={<StuckIcon />} className={s.panel} role="alert">
        <Stack gap="md" align="flex-start">
          <Text fz="md" fw={700} c="#000000">
            {apiDown}
          </Text>
          <Button color="ink" radius="md" h={44} loading={pending} onClick={() => start(() => state.retry())}>
            {retry}
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (state.kind === "empty") {
    const panel = (
      <Paper radius="lg" p="xl" className={s.quiet}>
        <Stack gap="sm">
          {frame ? null : <RequiredList items={required} />}
          <Text fz="md" c="#5C5C5C">
            {emptyProject}
          </Text>
        </Stack>
      </Paper>
    );
    return frame ? (
      <Shell frame={frame} required={required}>
        {panel}
      </Shell>
    ) : (
      panel
    );
  }

  return (
    <Paper radius="lg" p="xl" className={s.panel}>
      <Stack gap="md" align="flex-start">
        <Text fz="lg" fw={700} c="#000000">
          {notFound}
        </Text>
        <Anchor href={state.homeHref} fz="md" fw={700} c="#000000" underline="always" className={s.back}>
          {backHome}
        </Anchor>
      </Stack>
    </Paper>
  );
}
