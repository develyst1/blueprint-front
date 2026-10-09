import { expect, test } from "bun:test";
import { formatThaiDate } from "./date";

test("the worked example's createdAt, as SA-B ran it (Buddhist year, Bangkok date)", () => {
  expect(formatThaiDate("2026-10-08T17:42:17.814Z")).toBe("9 ต.ค. 2569");
});

test("UTC midnight lands on the Bangkok date, not the UTC one", () => {
  // 2026-10-08 00:00 UTC = 2026-10-08 07:00 in Bangkok → same day
  expect(formatThaiDate("2026-10-08T00:00:00.000Z")).toBe("8 ต.ค. 2569");
  // 2026-10-08 23:30 UTC = 2026-10-09 06:30 in Bangkok → the next day
  expect(formatThaiDate("2026-10-08T23:30:00.000Z")).toBe("9 ต.ค. 2569");
});

test("does not depend on the machine's time zone", () => {
  const before = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    expect(formatThaiDate("2026-10-08T17:42:17.814Z")).toBe("9 ต.ค. 2569");
  } finally {
    process.env.TZ = before;
  }
});
