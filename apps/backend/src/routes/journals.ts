import { Router } from "express";
import { createJournalSchema, updateJournalSchema } from "@journal-iq/shared";
import { prisma } from "../lib/prisma";
import { AppError, asyncHandler } from "../middleware/error";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { reflectLimiter } from "../middleware/aiRateLimit";
import { generateReflection } from "../services/ai";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      include: { prompt: true, mood: true },
    });
    res.json({ entries });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = createJournalSchema.parse(req.body);

    if (data.moodId) {
      const mood = await prisma.moodEntry.findFirst({
        where: { id: data.moodId, userId: req.user!.userId },
      });
      if (!mood) throw new AppError(400, "Invalid moodId");
    }

    if (data.promptId) {
      const prompt = await prisma.prompt.findUnique({ where: { id: data.promptId } });
      if (!prompt) throw new AppError(400, "Invalid promptId");
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.user!.userId,
        body: data.body,
        isFreeWrite: data.isFreeWrite ?? false,
        promptId: data.promptId || null,
        moodId: data.moodId || null,
      },
      include: { prompt: true, mood: true },
    });

    res.status(201).json({ entry });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { prompt: true, mood: true },
    });
    if (!entry) throw new AppError(404, "Entry not found");
    res.json({ entry });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = updateJournalSchema.parse(req.body);
    const existing = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError(404, "Entry not found");

    const entry = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        body: data.body ?? existing.body,
        isFreeWrite: data.isFreeWrite ?? existing.isFreeWrite,
        reflection: data.body && data.body !== existing.body ? null : existing.reflection,
      },
      include: { prompt: true, mood: true },
    });

    res.json({ entry });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError(404, "Entry not found");
    await prisma.journalEntry.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

router.post(
  "/:id/reflect",
  reflectLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { prompt: true },
    });
    if (!existing) throw new AppError(404, "Entry not found");

    const reflection = await generateReflection(
      existing.body,
      existing.prompt?.text
    );

    const entry = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: { reflection },
      include: { prompt: true, mood: true },
    });

    res.json({ entry });
  })
);

export default router;
