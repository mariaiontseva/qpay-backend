import type { IncomingMessage, ServerResponse } from "node:http";

import { buildServer } from "../src/server.js";

/**
 * Vercel serverless entry point.  We spin up the Fastify app once and
 * reuse it across warm invocations; Fluid Compute keeps the instance
 * alive between requests, so cold starts only happen on fresh deploys
 * or after long idle.
 */
const appPromise = (async () => {
  const app = buildServer();
  await app.ready();
  return app;
})();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await appPromise;
  app.server.emit("request", req, res);
}
