"use client";

// The page state's retry (AC-14). Client-only because it calls state.retry — a server action the core hands down.
import { Button } from "@heroui/react";
import { retry } from "@/core/words";

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button className="lg-state-retry" variant="primary" onPress={() => onRetry()}>
      {retry}
    </Button>
  );
}
