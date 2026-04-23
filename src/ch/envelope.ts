import { createHash } from "node:crypto";

import { create } from "xmlbuilder2";

import { buildCHMD5AuthValue } from "./auth-hash.js";

/**
 * Per the CH Technical Interface Specification (TIS v5.3 §3.3):
 *   "The <SenderID> element ... is the result of passing the Presenter_ID
 *   assigned to the presenter on registering to use the Companies House
 *   Software Filing service via the XML Gateway, through the lowercase
 *   MD5 Hash algorithm."
 *
 * So the wire format for SenderID is not the raw Presenter_ID — it's
 * MD5(Presenter_ID) as lowercase hex.
 */
function senderIdFromPresenterId(presenterId: string): string {
  return createHash("md5").update(presenterId, "utf8").digest("hex");
}

export interface EnvelopeParams {
  /** Class of the message, e.g. "IncorporationCompany" for IN01. */
  messageClass: string;
  /** "request" for outbound submissions. */
  qualifier: "request" | "poll";
  /** "submit" or "getresponse". */
  func: "submit" | "getresponse";
  /** Unique, incremental submission identifier.  Max ~32 chars. */
  transactionId: string;
  /** "1" for sandbox / test, "0" for production. */
  testFlag: "0" | "1";
  /** Presenter ID issued by Companies House. */
  presenterId: string;
  /** Authentication value issued by Companies House. */
  authValue: string;
  /** Package reference issued by Companies House per software product. */
  packageReference: string;
  /** Raw inner XML that belongs inside <Body>.  Must NOT include <Body> itself. */
  bodyXml: string;
}

/**
 * Wrap a submission body inside a full GovTalk envelope, with the CHMD5
 * authentication value computed over the body.
 *
 * The return string is UTF-8 XML ready to POST to the XML Gateway.
 */
export function buildGovTalkEnvelope(p: EnvelopeParams): string {
  const auth = buildCHMD5AuthValue({
    presenterId: p.presenterId,
    authValue: p.authValue,
    transactionId: p.transactionId,
  });

  const timestamp = new Date().toISOString();

  // Build the envelope skeleton with xmlbuilder2, then inject the raw
  // body XML verbatim (the hash was computed over this exact bytes).
  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("GovTalkMessage", {
      xmlns: "http://www.govtalk.gov.uk/CM/envelope",
    })
    .ele("EnvelopeVersion").txt("1.0").up()
    .ele("Header")
      .ele("MessageDetails")
        .ele("Class").txt(p.messageClass).up()
        .ele("Qualifier").txt(p.qualifier).up()
        .ele("Function").txt(p.func).up()
        .ele("TransactionID").txt(p.transactionId).up()
        .ele("GatewayTest").txt(p.testFlag).up()
        .ele("GatewayTimestamp").txt(timestamp).up()
      .up()
      .ele("SenderDetails")
        .ele("IDAuthentication")
          .ele("SenderID").txt(senderIdFromPresenterId(p.presenterId)).up()
          .ele("Authentication")
            .ele("Method").txt("CHMD5").up()
            .ele("Value").txt(auth).up()
          .up()
        .up()
      .up()
    .up()
    .ele("GovTalkDetails")
      .ele("Keys")
        .ele("Key", { Type: "PackageReference" }).txt(p.packageReference).up()
      .up()
    .up()
    .ele("Body").txt("__BODY_PLACEHOLDER__").up()
    .up();

  const rendered = doc.end({ prettyPrint: false });

  // Replace the placeholder with the literal body XML so its bytes exactly
  // match what the hash was computed over.
  return rendered.replace("__BODY_PLACEHOLDER__", p.bodyXml);
}
