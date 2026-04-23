import { supabase } from "../supabase.js";

/**
 * Every submission to the CH XML Gateway MUST carry a unique, incremental
 * TransactionID.  Reusing an id or going backwards makes CH reject the
 * submission outright with no error detail.
 *
 * The counter lives in Postgres (Supabase) so it survives across Vercel
 * cold starts and multiple instances.  The `next_ch_submission_id`
 * plpgsql function does an atomic `UPDATE ... RETURNING`, so concurrent
 * callers always get distinct, strictly increasing values.
 */
export async function nextTransactionId(prefix = "QPY"): Promise<string> {
  const { data, error } = await supabase().rpc("next_ch_submission_id");
  if (error) {
    throw new Error(
      `Failed to allocate TransactionID from Supabase: ${error.message}`,
    );
  }
  const n = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid next_ch_submission_id result: ${String(data)}`);
  }
  return `${prefix}${Math.trunc(n).toString().padStart(6, "0")}`;
}
