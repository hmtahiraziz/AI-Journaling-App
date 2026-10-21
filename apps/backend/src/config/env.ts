import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const accessExpiresSchema = z
  .string()
  .default("15m")
  .refine((v) => {
    const m = /^(\d+)([smh])$/.exec(v.trim());
    if (!m) return false;
    const n = Number(m[1]);
    const unit = m[2];
    const seconds = unit === "s" ? n : unit === "m" ? n * 60 : n * 3600;
    return seconds > 0 && seconds <= 15 * 60;
  }, "JWT_ACCESS_EXPIRES must be at most 15 minutes (e.g. 15m, 900s)");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    /** Reserved / defense-in-depth; refresh tokens are opaque random values, not JWTs. */
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: accessExpiresSchema,
    JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    JWT_ISSUER: z.string().default("journal-iq-api"),
    JWT_AUDIENCE: z.string().default("journal-iq-mobile"),
    OPENAI_API_KEY: z.string().optional().default(""),
    SMTP_HOST: z.string().optional().default(""),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_SECURE: z
      .string()
      .optional()
      .default("true")
      .transform((v) => v !== "false" && v !== "0"),
    SMTP_USER: z.string().optional().default(""),
    SMTP_PASS: z.string().optional().default(""),
    EMAIL_FROM: z.string().default("Journal IQ <noreply@gmail.com>"),
    MOBILE_RESET_URL: z.string().default("journaliq://reset-password"),
    /** Comma-separated web origins, or empty to disable CORS reflection. Never use * with credentials. */
    CLIENT_ORIGIN: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.SMTP_HOST || !data.SMTP_USER || !data.SMTP_PASS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "SMTP_HOST, SMTP_USER, and SMTP_PASS are required when NODE_ENV=production (password-reset emails must not fall back to console logs).",
        });
      }
      if (
        data.JWT_ACCESS_SECRET.includes("change-me") ||
        data.JWT_REFRESH_SECRET.includes("change-me")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "JWT secrets must not use the example change-me placeholders in production.",
        });
      }
    }
  });

export const env = envSchema.parse(process.env);

export function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}
