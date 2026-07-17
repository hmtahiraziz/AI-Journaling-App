import { Dimensions } from "react-native";

const W = Dimensions.get("window").width;

/** Content row height for icons (excludes safe-area). */
export const TAB_DOCK_HEIGHT = Math.round(Math.max(56, Math.min(62, W * 0.15)));

/**
 * How far the FAB rises above the dock’s content top edge.
 * Always relative to that edge — independent of system nav height.
 */
export const TAB_ORB_LIFT = Math.round(Math.max(16, Math.min(22, W * 0.048)));

/** Orb diameter. */
export const TAB_ORB_SIZE = Math.round(Math.max(52, Math.min(58, W * 0.135)));

/** Fixed center column so side tabs never collide with the orb. */
export const TAB_ORB_SLOT = Math.round(TAB_ORB_SIZE + 14);

/** Horizontal inset of the floating dock from screen edges. */
export const TAB_DOCK_INSET = Math.round(Math.max(12, Math.min(18, W * 0.04)));

/** Visual float gap between dock bottom and the system safe edge. */
export const TAB_FLOAT_GAP = 10;

/** Minimum floor for bottom inset (gesture nav can report ~0). */
export const TAB_SAFE_BOTTOM_FLOOR = 8;

/** Side-tab icon size. */
export const TAB_ICON_SIZE = Math.round(Math.max(22, Math.min(26, W * 0.058)));

/**
 * Optical nudge downward so icons sit mid-dock.
 * React Navigation’s icon slot sits slightly high even with labels hidden.
 */
export const TAB_CONTENT_NUDGE_Y = 5;

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
export function tabBarClearance(safeBottom = 0) {
  return TAB_DOCK_HEIGHT + TAB_ORB_LIFT + tabDockBottom(safeBottom) + TAB_CONTENT_GAP;
}
