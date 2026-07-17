/** Consistent type scale — avoid ad-hoc sizes in screens/components. */
export const type = {
  greeting: {
    fontSize: 28,
    lineHeight: 34,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  moodEmoji: {
    fontSize: 72,
    lineHeight: 84,
  },
  moodLabel: {
    fontSize: 28,
    lineHeight: 34,
  },
} as const;
