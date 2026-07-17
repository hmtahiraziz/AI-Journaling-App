import OpenAI from "openai";
import { env } from "../config/env";

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const CRISIS_PATTERNS =
  /\b(kill myself|suicide|suicidal|end my life|want to die|self[-\s]?harm|hurt myself)\b/i;

const REFLECTION_SYSTEM = `You are a gentle journaling companion for Journal IQ.
Write a short supportive reflection (2–4 sentences) on the user's journal entry.
Tone: warm, non-judgmental, affirming. Focus on perspective and emotional noticing.
Never diagnose, never label mental illnesses, never give medical advice, never claim to be therapy.
Do not use clinical jargon (depression, anxiety disorder, PTSD, bipolar, ADHD diagnosis, etc.).
If the entry is sparse, still respond kindly and invite gentle curiosity.
Respond in plain text only.`;

const INSIGHT_SYSTEM = `You are a gentle wellbeing journaling companion for Journal IQ.
Write 3–5 supportive sentences that connect mood check-ins with journaling themes from the week.
Mention patterns observationally (e.g. energy, people, rest) when present — never diagnose.
No clinical framing, no therapy claims, no medical advice.
Warm, practical, plain text only.`;

const CRISIS_RESPONSE =
  "It sounds like you're carrying something very heavy right now. You're not alone, and reaching out to people who can support you matters. If you're in immediate danger, please contact local emergency services or a trusted person nearby. You can also find localized resources at https://www.iasp.info/suicidalthoughts/.";

export function looksLikeCrisis(text: string) {
  return CRISIS_PATTERNS.test(text);
}

export async function generateReflection(entryBody: string, promptText?: string | null) {
  if (looksLikeCrisis(entryBody)) {
    return CRISIS_RESPONSE;
  }

  if (!openai) {
    return fallbackReflection(entryBody);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 220,
    messages: [
      { role: "system", content: REFLECTION_SYSTEM },
      {
        role: "user",
        content: [
          promptText ? `Prompt: ${promptText}` : null,
          `Journal entry:\n${entryBody}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || fallbackReflection(entryBody);
}

export type WeeklyInsightInput = {
  moods: { score: number; label: string; loggedAt: string }[];
  entries: {
    snippet: string;
    createdAt: string;
    isFreeWrite: boolean;
    promptText?: string | null;
    moodLabel?: string | null;
  }[];
  summary: {
    moodAverage: number | null;
    moodCount: number;
    journalCount: number;
    journalDays: number;
    topMoods: { label: string; count: number }[];
    themes: { label: string; count: number }[];
  };
};

export async function generateWeeklyInsight(input: WeeklyInsightInput) {
  if (!openai) {
    return fallbackInsight(input);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 360,
    messages: [
      { role: "system", content: INSIGHT_SYSTEM },
      {
        role: "user",
        content: JSON.stringify(input, null, 2),
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || fallbackInsight(input);
}

function fallbackReflection(body: string) {
  const preview = body.trim().slice(0, 80);
  return `Thank you for taking a moment to write. Noticing what arose for you — ${preview}${body.length > 80 ? "…" : ""} — already shows care for yourself. Be gentle with whatever is still unfolding.`;
}

function fallbackInsight(input: WeeklyInsightInput) {
  const { summary, moods } = input;
  if (!moods.length && summary.journalCount === 0) {
    return "This week is a blank page so far. Even one short check-in or journal entry can help you notice patterns with kindness.";
  }

  const parts: string[] = [];

  if (summary.moodCount > 0 && summary.moodAverage != null) {
    parts.push(
      `You logged ${summary.moodCount} mood check-in${summary.moodCount === 1 ? "" : "s"}, averaging about ${summary.moodAverage.toFixed(1)} out of 5.`
    );
  }

  if (summary.journalCount > 0) {
    parts.push(
      `You wrote on ${summary.journalDays} day${summary.journalDays === 1 ? "" : "s"} (${summary.journalCount} entr${summary.journalCount === 1 ? "y" : "ies"}).`
    );
  }

  if (summary.themes.length) {
    parts.push(
      `Themes that showed up often: ${summary.themes.map((t) => t.label).join(", ")}.`
    );
  }

  parts.push("Keep noticing what lifts or weighs on you — small observations add up.");
  return parts.join(" ");
}
