import { describe, expect, it } from "vitest";

import { buildCHMD5AuthValue } from "../auth-hash.js";

describe("CHMD5 auth value", () => {
  it("returns a 32-char lowercase hex digest", () => {
    const hash = buildCHMD5AuthValue({
      presenterId: "66666566000",
      authValue: "DMPRES11127",
      transactionId: "QPY000001",
    });
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic for the same inputs", () => {
    const args = {
      presenterId: "ID",
      authValue: "AUTH",
      transactionId: "T1",
    };
    expect(buildCHMD5AuthValue(args)).toBe(buildCHMD5AuthValue(args));
  });

  it("changes when any input changes", () => {
    const base = {
      presenterId: "ID",
      authValue: "AUTH",
      transactionId: "T1",
    };
    const diffTx = buildCHMD5AuthValue({ ...base, transactionId: "T2" });
    const diffAuth = buildCHMD5AuthValue({ ...base, authValue: "OTHER" });
    const original = buildCHMD5AuthValue(base);
    expect(diffTx).not.toBe(original);
    expect(diffAuth).not.toBe(original);
  });
});
