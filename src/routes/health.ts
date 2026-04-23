import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "qpay-backend",
    time: new Date().toISOString(),
  }));
}
