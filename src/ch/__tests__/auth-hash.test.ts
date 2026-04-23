import { describe, expect, it } from "vitest";

import { buildCHMD5AuthValue } from "../auth-hash.js";

describe("CHMD5 auth value", () => {
  it("returns a 32-char lowercase hex digest", () => {
    const hash = buildCHMD5AuthValue({
      presenterId: "66666566000",
      authValue: "DMPRES11127",
      bodyXml: "<CompanyIncorporation/>",
    });
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic for the same inputs", () => {
    const args = {
      presenterId: "ID",
      authValue: "AUTH",
      bodyXml: "<x/>",
    };
    expect(buildCHMD5AuthValue(args)).toBe(buildCHMD5AuthValue(args));
  });

  it("changes when any input changes", () => {
    const base = {
      presenterId: "ID",
      authValue: "AUTH",
      bodyXml: "<x/>",
    };
    const diffBody = buildCHMD5AuthValue({ ...base, bodyXml: "<y/>" });
    const diffAuth = buildCHMD5AuthValue({ ...base, authValue: "OTHER" });
    const original = buildCHMD5AuthValue(base);
    expect(diffBody).not.toBe(original);
    expect(diffAuth).not.toBe(original);
  });
});
