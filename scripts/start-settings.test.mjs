// SPEC-121 D3 / REQ-123: the start checks. `.mjs` on purpose — tsconfig has allowJs: false, so a `.ts` test importing the `.mjs` would fail typecheck.
import { describe, expect, test } from "bun:test";
import net from "node:net";
import { portFree, portFrom } from "./start-settings.mjs";

const wrong = (v) => ({ line: `blueprint-front: wrong setting PORT ("${v}" is not a port number) — see README § Configuration` });

describe("portFrom", () => {
  test("nothing set → 3100", () => expect(portFrom([], {})).toEqual({ port: 3100 }));
  test("PORT", () => expect(portFrom([], { PORT: "3191" })).toEqual({ port: 3191 }));
  test("PORT empty counts as unset", () => expect(portFrom([], { PORT: "" })).toEqual({ port: 3100 }));
  test("a -p argument wins over PORT", () => expect(portFrom(["-p", "3192"], { PORT: "3191" })).toEqual({ port: 3192 }));
  test("not a number, 0 and above 65535 → the PORT line with the value", () => {
    expect(portFrom([], { PORT: "abc" })).toEqual(wrong("abc"));
    expect(portFrom([], { PORT: "0" })).toEqual(wrong("0"));
    expect(portFrom([], { PORT: "70000" })).toEqual(wrong("70000"));
  });
  test("a bad -p value → the PORT line with that value", () => expect(portFrom(["-p", "x"], {})).toEqual(wrong("x")));
});

describe("portFree", () => {
  test("a free port → null", async () => {
    const probe = net.createServer();
    await new Promise((r) => probe.listen(0, r));
    const { port } = probe.address();
    await new Promise((r) => probe.close(r));
    expect(await portFree(port)).toBeNull();
  });

  test("a port held by another listener → the in-use line", async () => {
    const holder = net.createServer();
    await new Promise((r) => holder.listen(0, r));
    const { port } = holder.address();
    try {
      expect(await portFree(port)).toBe(`blueprint-front: port ${port} is in use — see README § Configuration`);
    } finally {
      await new Promise((r) => holder.close(r));
    }
  });
});
