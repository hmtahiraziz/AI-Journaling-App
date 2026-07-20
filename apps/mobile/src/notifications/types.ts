export type InboxNotificationKind =
  | "welcome"
  | "weekly_insight"
  | "write_nudge"
  | "streak";

/** In-app route targets the inbox can open. */
export type InboxHref =
  | "/(app)/(tabs)/insights"
  | "/(app)/(tabs)/home"
  | "/(app)/write"
  | "/(app)/(tabs)/journal";

export type InboxNotification = {
  id: string;
  kind: InboxNotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  href?: InboxHref;
  /** Prevents duplicate nudges for the same logical event. */
  dedupeKey: string;
};

export type InboxSnapshot = {
  userId: string;
  items: InboxNotification[];
};
