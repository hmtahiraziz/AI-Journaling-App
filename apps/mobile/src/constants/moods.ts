export const MOODS = [
  { score: 1, label: "Low", emoji: "😔" },
  { score: 2, label: "Uneasy", emoji: "😕" },
  { score: 3, label: "Okay", emoji: "😐" },
  { score: 4, label: "Good", emoji: "🙂" },
  { score: 5, label: "Great!", emoji: "😄" },
] as const;

export type MoodOption = (typeof MOODS)[number];

export function moodByScore(score: number) {
  return MOODS.find((m) => m.score === score) ?? MOODS[2];
}
