import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Every submission to the XML Gateway MUST carry a unique, incremental
 * TransactionID.  Reusing an id or going backwards makes CH reject the
 * submission outright with no error detail.
 *
 * For the MVP we keep the current counter in a flat JSON file on disk.
 * Once we have Postgres wired up, swap this implementation for a row in
 * a `submission_sequence` table with an advisory lock.
 */
const DEFAULT_PATH = "data/submission-state.json";

export async function nextTransactionId(
  prefix = "QPY",
  path = DEFAULT_PATH,
): Promise<string> {
  let state = { next: 1 };
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as { next?: number };
    if (typeof parsed.next === "number" && parsed.next > 0) {
      state = { next: parsed.next };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const current = state.next;
  state.next = current + 1;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2), "utf8");

  // Keep the id short enough for CH (max ~32 chars) and easy to spot
  // in their logs: `QPY000001`, `QPY000002`, …
  return `${prefix}${current.toString().padStart(6, "0")}`;
}
