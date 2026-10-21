import { z } from "zod";

/** Bump when Privacy Policy / Terms change; stored server-side on signup. */
export const LEGAL_CONSENT_VERSION = "2026-07-17";

export const signupSchema = z
  .object({
    name: z.string().min(1).max(80),
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    /** Client must affirm current legal docs; server records version + timestamp. */
    acceptedLegalVersion: z.string().min(1).max(32),
  })
  .strict();

export const signinSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().email().max(254),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(256),
    password: z.string().min(8).max(128),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1).max(512),
  })
  .strict();

/** Step-up auth for export / account delete. */
export const passwordConfirmSchema = z
  .object({
    password: z.string().min(1).max(128),
  })
  .strict();

export const createJournalSchema = z
  .object({
    body: z.string().min(1).max(20000),
    promptId: z.string().cuid().optional().nullable(),
    isFreeWrite: z.boolean().optional().default(false),
    moodId: z.string().cuid().optional().nullable(),
  })
  .strict();

export const updateJournalSchema = z
  .object({
    body: z.string().min(1).max(20000).optional(),
    isFreeWrite: z.boolean().optional(),
  })
  .strict();

export const createMoodSchema = z
  .object({
    score: z.number().int().min(1).max(5),
    label: z.string().min(1).max(40).optional(),
    note: z.string().max(500).optional().nullable(),
    /** Ignored by server — loggedAt is always set server-side to prevent streak farming. */
    loggedAt: z.string().datetime().optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    timezone: z.string().min(1).max(64).optional(),
  })
  .strict();

export const listJournalsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().cuid().optional(),
});

export const idParamSchema = z
  .object({
    id: z.string().cuid(),
  })
  .strict();

export const MOOD_LABELS: Record<number, string> = {
  1: "Low",
  2: "Uneasy",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type CreateMoodInput = z.infer<typeof createMoodSchema>;
