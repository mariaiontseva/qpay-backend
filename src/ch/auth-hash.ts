import { createHash } from "node:crypto";

/**
 * Build the CHMD5 authentication value for a GovTalk submission to the
 * Companies House XML Gateway.
 *
 * Per the XML Gateway Interface Specification (xmlgw.companieshouse.gov.uk)
 * the hash is computed as:
 *
 *     MD5( PresenterID + AuthenticationValue + TransactionID )
 *
 * and placed — as a lowercase hex digest — inside the envelope's
 * <IDAuthentication>/<Authentication>/<Value> element with
 * <Method>CHMD5</Method>.
 */
export function buildCHMD5AuthValue(args: {
  presenterId: string;
  authValue: string;
  transactionId: string;
}): string {
  const { presenterId, authValue, transactionId } = args;
  const input = `${presenterId}${authValue}${transactionId}`;
  return createHash("md5").update(input, "utf8").digest("hex");
}
