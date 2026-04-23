import { createHash } from "node:crypto";

/**
 * Build the CHMD5 authentication value for a GovTalk submission to the
 * Companies House XML Gateway.
 *
 * Per the CH XML Gateway technical spec, the hash is:
 *
 *     MD5( PresenterID + AuthenticationValue + BodyXml )
 *
 * where `BodyXml` is the canonical XML content of the <Body> element
 * (the IN01 payload), *without* surrounding whitespace.
 *
 * The hash is encoded as a lowercase hex string and placed inside the
 * envelope's <IDAuthentication> block.
 *
 * Note: Companies House currently accepts the plain lowercase hex; some
 * legacy tooling uppercases it.  Both are generally accepted, but we
 * stick with lowercase.
 */
export function buildCHMD5AuthValue(args: {
  presenterId: string;
  authValue: string;
  bodyXml: string;
}): string {
  const { presenterId, authValue, bodyXml } = args;
  const input = `${presenterId}${authValue}${bodyXml}`;
  return createHash("md5").update(input, "utf8").digest("hex");
}
