import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(30),
  OPENAI_API_KEY: z.string().optional().default(""),
  /** Gmail SMTP (or any SMTP). Leave empty to log reset links to the console. */
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
  CLIENT_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
