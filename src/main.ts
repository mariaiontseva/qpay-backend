import { loadConfig } from "./config.js";
import { buildServer } from "./server.js";

async function main() {
  const cfg = loadConfig();
  const app = buildServer();

  try {
    await app.listen({ port: cfg.PORT, host: "0.0.0.0" });
    app.log.info(`qpay-backend listening on :${cfg.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
