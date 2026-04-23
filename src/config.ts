import "dotenv/config";
import { z } from "zod";

/**
 * Strongly-typed environment config.  Fails fast at boot if any required
 * value is missing or malformed.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  // Companies House — XML Gateway (file filings)
  CH_PRESENTER_ID: z.string().min(1),
  CH_AUTH_VALUE: z.string().min(1),
  CH_PACKAGE_REFERENCE: z.string().min(1),
  CH_TEST_FLAG: z.enum(["0", "1"]).default("1"),
  CH_GATEWAY_URL: z
    .string()
    .url()
    .default("https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway"),

  // Companies House — Public Data API (read-only search)
  CH_PUBLIC_API_KEY: z.string().optional(),

  // Set to "1" while CH test credentials are pending or under review to skip
  // the real XML Gateway round-trip and return a fake-accepted response.
  // Lets the frontend-to-backend contract be exercised end-to-end without
  // waiting on Karolina.
  MOCK_CH_GATEWAY: z.enum(["0", "1"]).default("0"),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof schema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    const lines = Object.entries(tree.fieldErrors).map(
      ([k, errs]) => `  - ${k}: ${(errs ?? []).join(", ")}`,
    );
    throw new Error(
      `Invalid environment configuration:\n${lines.join("\n")}\n` +
        `Check your .env file against .env.example.`,
    );
  }
  cached = parsed.data;
  return cached;
}
