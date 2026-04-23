import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { healthRoutes } from "./routes/health.js";
import { formationRoutes } from "./routes/formation.js";

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "silent" : "info",
    },
    disableRequestLogging: false,
  });

  app.register(cors, { origin: true });
  app.register(healthRoutes);
  app.register(formationRoutes, { prefix: "/v1" });

  return app;
}
