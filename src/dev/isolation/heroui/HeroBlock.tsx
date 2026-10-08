"use client";

// HeroUI (+ Tailwind, its requirement): all of its CSS comes from heroui.css, imported only here.
import "./heroui.css";
import { Button, Card, Input, Table } from "@heroui/react";
import { SAMPLE } from "../sample";

export function HeroBlock() {
  return (
    <div data-theme-root="heroui">
      <Card>
        <Card.Header>
          <Card.Title>{SAMPLE.card}</Card.Title>
        </Card.Header>
        <Card.Content>
          <Button>{SAMPLE.button}</Button>
          <Input placeholder={SAMPLE.input} aria-label={SAMPLE.input} />
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={SAMPLE.column}>
                <Table.Header>
                  <Table.Column isRowHeader>{SAMPLE.column}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {SAMPLE.rows.map((r) => (
                    <Table.Row key={r} id={r}>
                      <Table.Cell>{r}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
}
