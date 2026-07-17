import rateLimit from "express-rate-limit";
import type { AuthRequest } from "./auth";

/**
 * Limits OpenAI-backed endpoints per authenticated user (falls back to IP).
 * Tuned to stop accidental loops / abuse without blocking normal journaling.
 */
export const reflectLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId;
    return userId || req.ip || "anonymous";
  },
  message: { error: "Reflection limit reached. Please try again in a little while." },
  validate: false,
});

export const weeklyInsightLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId;
    return userId || req.ip || "anonymous";
  },
  message: { error: "Weekly insight limit reached. Please try again later." },
  validate: false,
});
