// The name cookie → the name the back end is told (REQ-103, SPEC-104 D4).
import { describe, expect, test } from "bun:test";
import { BY_MAX, byCookie } from "@/core/name/cookie";
import { byHeader, cleanBy } from "./by";

describe("cleanBy", () => {
  test("a name as Next hands it over (already decoded), trimmed", () => {
    expect(cleanBy("โด่ง")).toBe("โด่ง");
    expect(cleanBy("  โด่ง  ")).toBe("โด่ง");
  });
  test("a value still percent-encoded is decoded once; a lone % stays", () => {
    expect(cleanBy(encodeURIComponent("โด่ง"))).toBe("โด่ง");
    expect(cleanBy("100%")).toBe("100%");
  });
  test("nothing, blank or over 100 characters → null (the page asks for the name again)", () => {
    expect(cleanBy(undefined)).toBeNull();
    expect(cleanBy("")).toBeNull();
    expect(cleanBy("   ")).toBeNull();
    expect(cleanBy("ก".repeat(BY_MAX))).toBe("ก".repeat(BY_MAX));
    expect(cleanBy("ก".repeat(BY_MAX + 1))).toBeNull();
  });
});

describe("byHeader / byCookie", () => {
  test("the header is the percent-encoded name (a Thai name is not a valid raw header value)", () => {
    expect(byHeader("โด่ง")).toEqual({ "X-Blueprint-By": "%E0%B9%82%E0%B8%94%E0%B9%88%E0%B8%87" });
    expect(decodeURIComponent(byHeader("โด่ง")["X-Blueprint-By"]!)).toBe("โด่ง");
  });
  test("the cookie is bp_by, percent-encoded, path /, one year", () => {
    expect(byCookie("โด่ง")).toBe(`bp_by=${encodeURIComponent("โด่ง")}; path=/; max-age=31536000; samesite=lax`);
  });
});

describe("the name button (REQ-103 AC-11)", () => {
  test('reads "{ชื่อ} · เปลี่ยนชื่อ" once a name is set', async () => {
    const { nameButtonText, changeName } = await import("@/core/words");
    expect(changeName).toBe("เปลี่ยนชื่อ");
    expect(nameButtonText("โด่ง")).toBe("โด่ง · เปลี่ยนชื่อ");
  });
});
