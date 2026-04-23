import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { submitIn01 } from "../ch/gateway-client.js";
import { buildSoloIn01 } from "../ch/in01-builder.js";
import { nextTransactionId } from "../ch/submission-sequence.js";

const submitBody = z.object({
  companyName: z.string().min(3).max(160),
  sicCode: z.string().regex(/^\d{5}$/),
  registeredOffice: z.object({
    premise: z.string(),
    street: z.string(),
    postTown: z.string(),
    postcode: z.string(),
    country: z.enum(["GB-ENG", "GB-WLS", "GB-SCT", "GB-NIR"]),
  }),
  director: z.object({
    title: z.string(),
    forename: z.string(),
    surname: z.string(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    nationality: z.string(),
    countryOfResidence: z.string(),
    residentialAddress: z.object({
      premise: z.string(),
      street: z.string(),
      postTown: z.string(),
      postcode: z.string(),
      country: z.string().min(2).max(3),
    }),
    personalCode: z.string().min(9).max(14),
  }),
  registeredEmail: z.string().email(),
});

export async function formationRoutes(app: FastifyInstance) {
  /**
   * POST /formation/submit
   *
   * Builds an IN01 from the supplied solo-founder input, submits it to the
   * Companies House XML Gateway, and returns CH's response.
   *
   * Auth is NOT wired yet — the mobile app will send its Supabase session
   * JWT once the middleware is in place.
   */
  app.post("/formation/submit", async (req, reply) => {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_request",
        details: parsed.error.flatten(),
      });
    }
    const input = parsed.data;

    const bodyXml = buildSoloIn01(input);
    const transactionId = await nextTransactionId();
    const result = await submitIn01({ bodyXml, transactionId });

    return reply.send({
      transactionId,
      outcome: result.outcome,
      httpStatus: result.httpStatus,
      errors: result.errors,
    });
  });
}
