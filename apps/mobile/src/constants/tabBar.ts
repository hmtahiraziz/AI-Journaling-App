import { Dimensions } from "react-native";

const W0 = Dimensions.get("window").width;

/** Max floating-dock width — compact centered island (not full-bleed). */
export const TAB_DOCK_MAX_WIDTH = 360;

/** Minimum side margin so the bar clearly floats in the middle. */
export const TAB_DOCK_MIN_INSET = 24;

/**
 * Dock length for a centered floating nav (≈78% of screen, capped).
 * Matches common mobile patterns: short pill centered above the home indicator.
 */
export function tabDockWidth(screenWidth: number) {
  const target = Math.round(screenWidth * 0.78);
  const maxForScreen = screenWidth - TAB_DOCK_MIN_INSET * 2;
  return Math.round(Math.min(TAB_DOCK_MAX_WIDTH, maxForScreen, Math.max(292, target)));
}

/**
 * Equal left/right inset that centers the dock on every screen size.
 */
export function tabDockInset(screenWidth: number) {
  const dockWidth = tabDockWidth(screenWidth);
  return Math.round(Math.max(TAB_DOCK_MIN_INSET, (screenWidth - dockWidth) / 2));
}

/** Dock content height — scales lightly with width, clamped for all phones. */
export function tabDockHeight(screenWidth: number) {
  return Math.round(Math.max(60, Math.min(66, screenWidth * 0.15)));
}

/** Side-tab icon size. */
export function tabIconSize(screenWidth: number) {
  return Math.round(Math.max(26, Math.min(30, screenWidth * 0.07)));
}

/** How far the FAB rises above the dock’s content top edge. */
export function tabOrbLift(screenWidth: number) {
  return Math.round(Math.max(16, Math.min(22, screenWidth * 0.048)));
}

/** Orb diameter. */
export function tabOrbSize(screenWidth: number) {
  return Math.round(Math.max(54, Math.min(60, screenWidth * 0.135)));
}

/** Fixed center column so side tabs never collide with the orb. */
export function tabOrbSlot(orbSize: number) {
  return Math.round(orbSize + 14);
}

/** Static fallbacks (initial window) for modules that don’t re-measure. */
export const TAB_DOCK_INSET = tabDockInset(W0);
export const TAB_DOCK_HEIGHT = tabDockHeight(W0);
export const TAB_ICON_SIZE = tabIconSize(W0);
export const TAB_ORB_LIFT = tabOrbLift(W0);
export const TAB_ORB_SIZE = tabOrbSize(W0);
export const TAB_ORB_SLOT = tabOrbSlot(TAB_ORB_SIZE);

/** Visual float gap between dock bottom and the system safe edge. */
export const TAB_FLOAT_GAP = 12;

/** Minimum floor for bottom inset (gesture nav can report ~0). */
export const TAB_SAFE_BOTTOM_FLOOR = 8;

/**
 * Optical nudge downward so icons sit mid-dock.
 * React Navigation’s icon slot sits slightly high even with labels hidden.
 */
export const TAB_CONTENT_NUDGE_Y = 6;

/** Extra gap below last scroll content above the dock. */
export const TAB_CONTENT_GAP = 20;

/** Dynamic bottom inset — works for 3-button and gesture nav without rebuild. */
export function tabSafeBottom(insetsBottom = 0) {
  return Math.max(insetsBottom, TAB_SAFE_BOTTOM_FLOOR);
}

/**
 * Distance from physical screen bottom to the floating dock’s bottom edge.
 * Lifts the whole island above 3-button / gesture system nav.
 */
export function tabDockBottom(insetsBottom = 0) {
  return tabSafeBottom(insetsBottom) + TAB_FLOAT_GAP;
}

/**
 * Bottom padding for tab screens so content clears dock + FAB + system nav.
 * Pass `insets.bottom` from `useSafeAreaInsets()`.
 */
export function tabBarClearance(safeBottom = 0, screenWidth = W0) {
  const height = tabDockHeight(screenWidth);
  const lift = tabOrbLift(screenWidth);
  return height + lift + tabDockBottom(safeBottom) + TAB_CONTENT_GAP;
}
