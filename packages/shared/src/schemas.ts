import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createJournalSchema = z.object({
  body: z.string().min(1).max(20000),
  promptId: z.string().cuid().optional().nullable(),
  isFreeWrite: z.boolean().optional().default(false),
  moodId: z.string().cuid().optional().nullable(),
});

export const updateJournalSchema = z.object({
  body: z.string().min(1).max(20000).optional(),
  isFreeWrite: z.boolean().optional(),
});

export const createMoodSchema = z.object({
  score: z.number().int().min(1).max(5),
  label: z.string().min(1).max(40).optional(),
  note: z.string().max(500).optional().nullable(),
  loggedAt: z.string().datetime().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

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
