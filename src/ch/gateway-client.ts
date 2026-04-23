import { loadConfig } from "../config.js";
import { buildGovTalkEnvelope } from "./envelope.js";

export interface SubmitResult {
  /** Raw HTTP status from the XML Gateway. */
  httpStatus: number;
  /** Transaction id echoed back by CH (or ours, if they didn't change it). */
  transactionId: string;
  /** "Accepted" or "Rejected" or "Acknowledged" — depends on CH's response. */
  outcome: "accepted" | "acknowledged" | "rejected" | "error";
  /** Whole CH response body, kept for debugging / Karolina's review. */
  rawResponse: string;
  /** If outcome = rejected: the list of CH error codes + messages. */
  errors: Array<{ code?: string; text: string }>;
}

/**
 * POST a pre-built IN01 body to the Companies House XML Gateway.
 *
 * The caller is responsible for supplying an *unique, incremental*
 * transactionId — CH rejects non-incrementing ids outright.
 */
export async function submitIn01(args: {
  bodyXml: string;
  transactionId: string;
  /** Optional out-param: the full outgoing envelope, for logging. */
  onEnvelopeBuilt?: (envelope: string) => void;
}): Promise<SubmitResult> {
  const cfg = loadConfig();

  const envelope = buildGovTalkEnvelope({
    messageClass: "CompanyIncorporation",
    qualifier: "request",
    func: "submit",
    transactionId: args.transactionId,
    testFlag: cfg.CH_TEST_FLAG,
    presenterId: cfg.CH_PRESENTER_ID,
    authValue: cfg.CH_AUTH_VALUE,
    packageReference: cfg.CH_PACKAGE_REFERENCE,
    bodyXml: args.bodyXml,
  });
  args.onEnvelopeBuilt?.(envelope);

  if (cfg.MOCK_CH_GATEWAY === "1") {
    const fakeCompanyNumber =
      "99" + String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0");
    return {
      httpStatus: 200,
      transactionId: args.transactionId,
      outcome: "accepted",
      rawResponse:
        `<MockedResponse companyNumber="${fakeCompanyNumber}" ` +
        `transactionId="${args.transactionId}"/>`,
      errors: [],
    };
  }

  const response = await fetch(cfg.CH_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=UTF-8",
      Accept: "text/xml",
    },
    body: envelope,
  });

  const rawResponse = await response.text();
  const outcome = inferOutcome(response.status, rawResponse);
  const errors = outcome === "rejected" ? extractErrors(rawResponse) : [];

  return {
    httpStatus: response.status,
    transactionId: args.transactionId,
    outcome,
    rawResponse,
    errors,
  };
}

function inferOutcome(
  httpStatus: number,
  body: string,
): SubmitResult["outcome"] {
  if (httpStatus >= 500) return "error";
  if (/Qualifier>\s*error/i.test(body)) return "rejected";
  if (/Qualifier>\s*acknowledgement/i.test(body)) return "acknowledged";
  if (/Qualifier>\s*response/i.test(body)) return "accepted";
  // Fallback: HTTP 200 w/o a recognisable qualifier = accepted-ish.
  return httpStatus === 200 ? "accepted" : "error";
}

/**
 * Pull CH's <GovTalkErrors> block into a flat list of `{code, text}` pairs
 * for logging / display.  Returns an empty array if no errors are present.
 */
function extractErrors(body: string): Array<{ code?: string; text: string }> {
  const out: Array<{ code?: string; text: string }> = [];
  const errorRegex = /<Error>([\s\S]*?)<\/Error>/g;
  const codeRegex = /<Number>([\s\S]*?)<\/Number>/;
  const textRegex = /<Text>([\s\S]*?)<\/Text>/;
  let m: RegExpExecArray | null;
  while ((m = errorRegex.exec(body)) !== null) {
    const block = m[1] ?? "";
    const code = codeRegex.exec(block)?.[1]?.trim();
    const text = textRegex.exec(block)?.[1]?.trim() ?? "";
    out.push({ code, text });
  }
  return out;
}
