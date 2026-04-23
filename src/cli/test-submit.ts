#!/usr/bin/env tsx
/**
 * One-shot CLI that builds a sample IN01 for an internal test company and
 * submits it to the Companies House sandbox.  Run:
 *
 *     npm run ch:test-submit
 *
 * Reads all credentials from .env.  Writes the outgoing envelope and the
 * full CH response to ./logs/ so Karolina can review.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import { submitIn01 } from "../ch/gateway-client.js";
import { buildSoloIn01, type SoloIn01Input } from "../ch/in01-builder.js";
import { nextTransactionId } from "../ch/submission-sequence.js";

const sample: SoloIn01Input = {
  companyName: "QPay Internal Test",
  sicCode: "62012",
  registeredOffice: {
    premise: "Office 1.01",
    street: "411 Oxford Street",
    postTown: "London",
    postcode: "W1C 2PE",
    country: "GB-ENG",
  },
  director: {
    title: "Mr",
    forename: "John",
    surname: "Donn",
    dateOfBirth: "1988-05-12",
    nationality: "British",
    countryOfResidence: "United Kingdom",
    residentialAddress: {
      premise: "45",
      street: "King's Road",
      postTown: "London",
      postcode: "SW3 4UH",
      country: "GB",
    },
    // Sandbox accepts any well-formed 11-char personal code; replace with
    // a real One Login code for production submissions.
    personalCode: "TEST000001A",
  },
  registeredEmail: "noreply@qpayments.co.uk",
};

async function main() {
  const bodyXml = buildSoloIn01(sample);
  const transactionId = await nextTransactionId();

  // Persist the outbound envelope for Karolina's review & debugging.
  await mkdir("logs", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = `logs/submit-${stamp}-${transactionId}.xml`;
  await writeFile(outPath, bodyXml, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[test-submit] built IN01 body → ${outPath}`);
  // eslint-disable-next-line no-console
  console.log(`[test-submit] transactionId = ${transactionId}`);

  const result = await submitIn01({ bodyXml, transactionId });

  const respPath = `logs/response-${stamp}-${transactionId}.xml`;
  await writeFile(respPath, result.rawResponse, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[test-submit] HTTP ${result.httpStatus} · outcome: ${result.outcome}`);
  // eslint-disable-next-line no-console
  console.log(`[test-submit] raw CH response → ${basename(respPath)}`);

  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[test-submit] CH errors:");
    for (const e of result.errors) {
      // eslint-disable-next-line no-console
      console.log(`  - ${e.code ?? "?"}: ${e.text}`);
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[test-submit] fatal:", err);
  process.exit(1);
});
