"use client";

// Mantine: no global.css, no baseline.css, no default-css-variables.css — only the component sheets used here,
// in Mantine's dependency order. Theme variables are written on the block root, not on :root.
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Input.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/Card.css";
import "@mantine/core/styles/Table.css";
import { Button, Card, MantineProvider, Table, TextInput } from "@mantine/core";
import s from "./mantine-block.module.css";
import { SAMPLE } from "./sample";

const ROOT = '[data-theme-root="mantine"]';

export function MantineBlock() {
  return (
    <div data-theme-root="mantine" data-mantine-color-scheme="light" className={s.root}>
      <MantineProvider
        cssVariablesSelector={ROOT}
        deduplicateCssVariables={false}
        withGlobalClasses={false}
        forceColorScheme="light"
        getRootElement={() => (typeof document === "undefined" ? undefined : document.querySelector<HTMLElement>(ROOT) ?? undefined)}
      >
        <Card withBorder padding="md">
          <strong>{SAMPLE.card}</strong>
          <Button mt="sm">{SAMPLE.button}</Button>
          <TextInput mt="sm" placeholder={SAMPLE.input} aria-label={SAMPLE.input} />
          <Table mt="sm" withTableBorder>
            <Table.Thead><Table.Tr><Table.Th>{SAMPLE.column}</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{SAMPLE.rows.map((r) => <Table.Tr key={r}><Table.Td>{r}</Table.Td></Table.Tr>)}</Table.Tbody>
          </Table>
        </Card>
      </MantineProvider>
    </div>
  );
}
