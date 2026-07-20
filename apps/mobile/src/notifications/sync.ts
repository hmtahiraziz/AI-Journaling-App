import type { InboxHref, InboxNotification, InboxNotificationKind } from "./types";
import { localDayKey } from "./format";

export type InboxSeedInput = {
  entryCount: number;
  wroteToday: boolean;
  streakCount: number;
  weeklyInsight?: {
    periodStart: string;
    preview: string;
  } | null;
};

type SeedDraft = {
  kind: InboxNotificationKind;
  title: string;
  body: string;
  dedupeKey: string;
  href?: InboxHref;
};

/**
 * Pure rules: turn app state into inbox candidates.
 * The store upserts by dedupeKey so re-syncs stay idempotent.
 */
export function buildInboxSeeds(input: InboxSeedInput): SeedDraft[] {
  const seeds: SeedDraft[] = [];
  const day = localDayKey();

  seeds.push({
    kind: "welcome",
    title: "Welcome to Journal IQ",
    body: "Your private space for prompts, mood, and gentle reflections.",
    dedupeKey: "welcome",
    href: "/(app)/(tabs)/home",
  });

  if (input.weeklyInsight?.periodStart) {
    const preview = input.weeklyInsight.preview.trim();
    seeds.push({
      kind: "weekly_insight",
      title: "Weekly insight ready",
      body: preview
        ? preview.length > 120
          ? `${preview.slice(0, 117)}…`
          : preview
        : "A short summary of this week’s themes is waiting for you.",
      dedupeKey: `weekly_insight:${input.weeklyInsight.periodStart}`,
      href: "/(app)/(tabs)/insights",
    });
  }

  if (input.entryCount > 0 && !input.wroteToday) {
    seeds.push({
      kind: "write_nudge",
      title: "A quiet moment today?",
      body: "Even a few lines keep your streak honest — no pressure, just noticing.",
      dedupeKey: `write_nudge:${day}`,
      href: "/(app)/write",
    });
  }

  if (input.streakCount >= 3 && input.wroteToday) {
    seeds.push({
      kind: "streak",
      title: `${input.streakCount}-day streak`,
      body: "You showed up again. That consistency is worth noticing.",
      dedupeKey: `streak:${day}:${input.streakCount}`,
      href: "/(app)/(tabs)/home",
    });
  }

  return seeds;
}

export function mergeSeed(
  existing: InboxNotification[],
  draft: SeedDraft,
  createId: () => string,
  nowIso = () => new Date().toISOString()
): InboxNotification[] {
  if (existing.some((item) => item.dedupeKey === draft.dedupeKey)) {
    return existing;
  }

  const next: InboxNotification = {
    id: createId(),
    kind: draft.kind,
    title: draft.title,
    body: draft.body,
    createdAt: nowIso(),
    readAt: null,
    href: draft.href,
    dedupeKey: draft.dedupeKey,
  };

  return [next, ...existing];
}
