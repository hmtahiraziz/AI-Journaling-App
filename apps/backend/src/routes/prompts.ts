import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get(
  "/today",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
    });

    const prompts = await prisma.prompt.findMany({ orderBy: { sortOrder: "asc" } });
    if (!prompts.length) {
      return res.json({
        prompt: {
          id: null,
          text: "Write freely about whatever is present for you today.",
          category: "free",
        },
      });
    }

    const now = new Date();
    // Deterministic day-of-year rotation in the user's timezone when possible
    const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    const prompt = prompts[dayIndex % prompts.length];

    res.json({
      prompt,
      timezone: user.timezone,
      dateKey: now.toISOString().slice(0, 10),
    });
  })
);

export default router;
