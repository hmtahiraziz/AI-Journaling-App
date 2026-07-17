import { api } from "./client";

export type Prompt = { id: string; text: string; category: string };

export type Mood = {
  id: string;
  score: number;
  label: string;
  note?: string | null;
  loggedAt: string;
};

export type JournalEntry = {
  id: string;
  body: string;
  isFreeWrite: boolean;
  reflection?: string | null;
  createdAt: string;
  prompt?: Prompt | null;
  mood?: Mood | null;
};

export async function getTodayPrompt() {
  const { data } = await api.get<{ prompt: Prompt; dateKey: string }>("/prompts/today");
  return data;
}

export async function listJournals() {
  const { data } = await api.get<{ entries: JournalEntry[] }>("/journals");
  return data.entries;
}

export async function getJournal(id: string) {
  const { data } = await api.get<{ entry: JournalEntry }>(`/journals/${id}`);
  return data.entry;
}

export async function createJournal(input: {
  body: string;
  promptId?: string | null;
  isFreeWrite?: boolean;
  moodId?: string | null;
}) {
  const { data } = await api.post<{ entry: JournalEntry }>("/journals", input);
  return data.entry;
}

export async function reflectOnJournal(id: string) {
  const { data } = await api.post<{ entry: JournalEntry }>(`/journals/${id}/reflect`);
  return data.entry;
}

export async function deleteJournal(id: string) {
  await api.delete(`/journals/${id}`);
}

export async function listMoods() {
  const { data } = await api.get<{ moods: Mood[] }>("/moods");
  return data.moods;
}

export async function createMood(input: { score: number; label?: string; note?: string }) {
  const { data } = await api.post<{ mood: Mood }>("/moods", input);
  return data.mood;
}

export async function getMoodStats() {
  const { data } = await api.get<{
    average: number | null;
    count: number;
    daily: { date: string; average: number; count: number }[];
  }>("/moods/stats");
  return data;
}

export type WeeklyInsightSummary = {
  moodAverage: number | null;
  moodCount: number;
  journalCount: number;
  journalDays: number;
  topMoods: { label: string; count: number }[];
  themes: { id: string; label: string; count: number }[];
};

export type WeeklyInsightPayload = {
  insight: { id: string; content: string; periodStart: string; periodEnd: string };
  summary: WeeklyInsightSummary;
};

export async function getWeeklyInsight() {
  const { data } = await api.get<WeeklyInsightPayload>("/insights/weekly");
  return data;
}
