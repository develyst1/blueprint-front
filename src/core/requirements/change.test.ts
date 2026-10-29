// The change-set bodies a requirement step sends (REQ-103 AC-4, SPEC-104 § Requirement part kind).
import { describe, expect, test } from "bun:test";
import { bangkokToday, requirementChange } from "./change";

describe("requirementChange", () => {
  const noon = new Date("2026-10-29T12:00:00Z"); // 19:00 in Bangkok, still the 29th
  const lateNight = new Date("2026-10-29T18:30:00Z"); // 01:30 on the 30th in Bangkok

  test("add → one part.add of kind requirement, body { text }, operator cause and origin, today in Bangkok", () => {
    expect(requirementChange({ op: "add", title: "ชำระเงินได้", text: "จ่ายด้วยบัตร" }, noon)).toEqual({
      cause: { kind: "operator" },
      changes: [{ op: "part.add", ref: "$r", kind: "requirement", title: "ชำระเงินได้", body: { text: "จ่ายด้วยบัตร" }, origin: { stamp: "operator", date: "2026-10-29" } }],
    });
  });

  test("update → part.update with the key, title and body; remove → part.remove with the key only", () => {
    expect(requirementChange({ op: "update", key: "REQ-001", title: "ใหม่", text: "ข้อความใหม่" }, noon).changes).toEqual([
      { op: "part.update", key: "REQ-001", title: "ใหม่", body: { text: "ข้อความใหม่" }, origin: { stamp: "operator", date: "2026-10-29" } },
    ]);
    expect(requirementChange({ op: "remove", key: "REQ-001" }, noon).changes).toEqual([{ op: "part.remove", key: "REQ-001" }]);
  });

  test("the date is Bangkok's calendar day, not UTC's", () => {
    expect(bangkokToday(lateNight)).toBe("2026-10-30");
    expect(bangkokToday(noon)).toBe("2026-10-29");
  });
});
