import type { InboxNotification, InboxNotificationKind } from "./types";

export const INBOX_MAX_ITEMS = 40;

export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function kindIcon(kind: InboxNotificationKind) {
  switch (kind) {
    case "weekly_insight":
      return "sparkles-outline" as const;
    case "write_nudge":
      return "create-outline" as const;
    case "streak":
      return "flame-outline" as const;
    case "welcome":
    default:
      return "heart-outline" as const;
  }
}

export function formatInboxTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function sortInbox(items: InboxNotification[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function unreadCount(items: InboxNotification[]) {
  return items.reduce((n, item) => (item.readAt ? n : n + 1), 0);
}

export function trimInbox(items: InboxNotification[]) {
  return sortInbox(items).slice(0, INBOX_MAX_ITEMS);
}
