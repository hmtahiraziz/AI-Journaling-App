export const colors = {
  primary: "#C4E562",
  secondary: "#00CFEE",
  mint: "#9ED99A",
  ink: "#FEFEFE",
  night: "#01122F",
  nightDeep: "#000A1A",
  glass: "rgba(254,254,254,0.08)",
  glassBorder: "rgba(254,254,254,0.18)",
  glassStrong: "rgba(254,254,254,0.14)",
  /** Top rim highlight for liquid-glass surfaces */
  glassHighlight: "rgba(254,254,254,0.22)",
  /** Soft primary wash inside floating dock — tinted glass */
  dockGlass: "rgba(196,229,98,0.22)",
  muted: "rgba(254,254,254,0.55)",
  /** Soft lime accents for active UI */
  primaryGlow: "rgba(196,229,98,0.35)",
  primaryGlowSoft: "rgba(196,229,98,0.16)",
  /** Card / dock shadow on dark navy */
  shadow: "rgba(0,0,0,0.45)",
} as const;

/** Shared corner radius — rounded-2xl cohesion (20–24). */
export const radii = {
  card: 22,
  tile: 24,
  tileLg: 24,
  dock: 32,
  pill: 999,
} as const;

/** Soft Material-3-like elevation for dark UI. */
export const elevation = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fab: {
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dock: {
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;
