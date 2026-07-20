import { create } from "zustand";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import type { InboxNotification, InboxSnapshot } from "@/src/notifications/types";
import { trimInbox, unreadCount } from "@/src/notifications/format";
import { buildInboxSeeds, mergeSeed, type InboxSeedInput } from "@/src/notifications/sync";

const DIR = `${FileSystem.documentDirectory}inbox/`;

type NotificationsState = {
  userId: string | null;
  items: InboxNotification[];
  hydrated: boolean;
  hydrate: (userId: string | null | undefined) => Promise<void>;
  syncFromAppState: (input: InboxSeedInput) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => void;
};

function pathFor(userId: string) {
  return `${DIR}${userId}.json`;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

async function readSnapshot(userId: string): Promise<InboxNotification[]> {
  try {
    const path = pathFor(userId);
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as InboxSnapshot;
    if (!parsed || parsed.userId !== userId || !Array.isArray(parsed.items)) return [];
    return trimInbox(parsed.items);
  } catch {
    return [];
  }
}

async function writeSnapshot(userId: string, items: InboxNotification[]) {
  await ensureDir();
  const payload: InboxSnapshot = { userId, items: trimInbox(items) };
  await FileSystem.writeAsStringAsync(pathFor(userId), JSON.stringify(payload));
}

function createId() {
  return Crypto.randomUUID();
}

function sameIds(a: InboxNotification[], b: InboxNotification[]) {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.id === b[i]?.id && item.dedupeKey === b[i]?.dedupeKey);
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  userId: null,
  items: [],
  hydrated: false,

  hydrate: async (userId) => {
    if (!userId) {
      set({ userId: null, items: [], hydrated: true });
      return;
    }
    const items = await readSnapshot(userId);
    set({ userId, items, hydrated: true });
  },

  syncFromAppState: async (input) => {
    const { userId, items, hydrated } = get();
    if (!userId || !hydrated) return;

    let next = items;
    for (const seed of buildInboxSeeds(input)) {
      next = mergeSeed(next, seed, createId);
    }
    next = trimInbox(next);
    if (sameIds(next, items)) return;

    set({ items: next });
    await writeSnapshot(userId, next);
  },

  markRead: async (id) => {
    const { userId, items } = get();
    if (!userId) return;

    const target = items.find((item) => item.id === id);
    if (!target || target.readAt) return;

    const now = new Date().toISOString();
    const next = items.map((item) =>
      item.id === id ? { ...item, readAt: now } : item
    );
    set({ items: next });
    await writeSnapshot(userId, next);
  },

  markAllRead: async () => {
    const { userId, items } = get();
    if (!userId || !items.some((item) => !item.readAt)) return;

    const now = new Date().toISOString();
    const next = items.map((item) => (item.readAt ? item : { ...item, readAt: now }));
    set({ items: next });
    await writeSnapshot(userId, next);
  },

  remove: async (id) => {
    const { userId, items } = get();
    if (!userId) return;
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return;
    set({ items: next });
    await writeSnapshot(userId, next);
  },

  clear: () => set({ userId: null, items: [], hydrated: false }),
}));

export function selectUnreadCount(state: NotificationsState) {
  return unreadCount(state.items);
}
