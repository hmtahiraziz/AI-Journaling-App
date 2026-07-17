/** Lightweight theme cues from journal text — observational, never clinical. */

const THEME_RULES: { id: string; label: string; pattern: RegExp }[] = [
  { id: "work", label: "Work & focus", pattern: /\b(work|job|career|meeting|deadline|boss|office|project|client)\b/i },
  { id: "rest", label: "Rest & energy", pattern: /\b(sleep|tired|rest|energy|exhausted|nap|insomnia)\b/i },
  { id: "people", label: "People & connection", pattern: /\b(friend|family|partner|mom|dad|sister|brother|colleague|love|relationship)\b/i },
  { id: "gratitude", label: "Gratitude", pattern: /\b(grateful|thankful|appreciate|blessing|lucky)\b/i },
  { id: "growth", label: "Growth & learning", pattern: /\b(learn|growth|goal|progress|habit|practice|improve)\b/i },
  { id: "stress", label: "Pressure & stress", pattern: /\b(stress|overwhelm|anxious|worry|pressure|burnout)\b/i },
  { id: "body", label: "Body & movement", pattern: /\b(walk|run|gym|exercise|health|pain|body|yoga)\b/i },
  { id: "creativity", label: "Creativity", pattern: /\b(creat|art|music|write|idea|design|imagination)\b/i },
];

export function extractThemes(texts: string[], limit = 4): { id: string; label: string; count: number }[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const text of texts) {
    for (const rule of THEME_RULES) {
      if (rule.pattern.test(text)) {
        const prev = counts.get(rule.id);
        counts.set(rule.id, {
          label: rule.label,
          count: (prev?.count || 0) + 1,
        });
      }
    }
  }

  return [...counts.entries()]
    .map(([id, v]) => ({ id, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
