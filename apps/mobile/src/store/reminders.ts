import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

const ENABLED_KEY = "jiq_reminder_enabled";
const HOUR_KEY = "jiq_reminder_hour";
const MINUTE_KEY = "jiq_reminder_minute";
const NOTIFICATION_ID = "journal-iq-daily-reminder";

const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

/** Expo Go cannot schedule reliable Android notifications (SDK 53+). */
export const isExpoGo = Constants.appOwnership === "expo";

/** True when local notification scheduling is supported in this runtime. */
export const canScheduleReminders = !isExpoGo;

type NotificationsModule = typeof import("expo-notifications");

let notificationsMod: NotificationsModule | null = null;
let handlerReady = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo) return null;
  if (notificationsMod) return notificationsMod;
  notificationsMod = await import("expo-notifications");
  if (!handlerReady) {
    notificationsMod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  }
  return notificationsMod;
}

export type ReminderEnableResult = {
  ok: boolean;
  reason?: string;
  limited?: boolean;
  /** Permission permanently denied — open system Settings. */
  openSettings?: boolean;
};

type ReminderState = {
  enabled: boolean;
  hour: number;
  minute: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<ReminderEnableResult>;
  setTime: (hour: number, minute: number) => Promise<void>;
};

async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminders", {
      name: "Daily reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      bypassDnd: false,
      description: "Gentle daily nudges to journal with Journal IQ.",
    });
  }
}

type PermissionResult = {
  granted: boolean;
  /** False when the OS will no longer show the system prompt (user must use Settings). */
  canAskAgain: boolean;
};

async function requestPermission(Notifications: NotificationsModule): Promise<PermissionResult> {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return { granted: true, canAskAgain: true };
  }

  if (current.canAskAgain === false) {
    return { granted: false, canAskAgain: false };
  }

  const asked = await Notifications.requestPermissionsAsync();
  const granted =
    asked.granted ||
    asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  return {
    granted,
    canAskAgain: asked.canAskAgain !== false,
  };
}

function denialMessage(canAskAgain: boolean): ReminderEnableResult {
  if (Platform.OS === "android") {
    return {
      ok: false,
      openSettings: true,
      reason: canAskAgain
        ? "Notifications permission is required for reminders. Allow notifications when prompted, or enable them in system Settings."
        : "Notifications are blocked for Journal IQ. Open Settings → Apps → Journal IQ → Notifications, turn them on, then try again.",
    };
  }
  return {
    ok: false,
    openSettings: true,
    reason: canAskAgain
      ? "Notifications permission is required for reminders."
      : "Notifications are off for Journal IQ. Enable them in Settings → Journal IQ → Notifications, then try again.",
  };
}

async function cancelScheduled(Notifications: NotificationsModule) {
  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  } catch {
    // id may not exist
  }
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(
        (n) =>
          n.identifier === NOTIFICATION_ID || n.content.data?.kind === "daily-reminder"
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

async function scheduleDaily(hour: number, minute: number) {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await ensureAndroidChannel(Notifications);
  await cancelScheduled(Notifications);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: "Journal IQ",
      body: "A quiet minute to check in — whenever you’re ready.",
      data: { kind: "daily-reminder" },
      ...(Platform.OS === "android" ? { channelId: "daily-reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export function formatTime(hour: number, minute: number) {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

/** Soft helper for Settings — “Next nudge · today/tomorrow at 8:00 PM”. */
export function formatNextNudge(hour: number, minute: number) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  const isTomorrow = next.getTime() <= now.getTime();
  return `Next nudge · ${isTomorrow ? "tomorrow" : "today"} at ${formatTime(hour, minute)}`;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  enabled: false,
  hour: DEFAULT_HOUR,
  minute: DEFAULT_MINUTE,
  hydrated: false,

  hydrate: async () => {
    const enabled = (await SecureStore.getItemAsync(ENABLED_KEY)) === "1";
    const hourRaw = await SecureStore.getItemAsync(HOUR_KEY);
    const minuteRaw = await SecureStore.getItemAsync(MINUTE_KEY);
    const hour = hourRaw != null ? Number(hourRaw) : DEFAULT_HOUR;
    const minute = minuteRaw != null ? Number(minuteRaw) : DEFAULT_MINUTE;
    set({
      enabled,
      hour: Number.isFinite(hour) ? hour : DEFAULT_HOUR,
      minute: Number.isFinite(minute) ? minute : DEFAULT_MINUTE,
      hydrated: true,
    });

    // Never load expo-notifications inside Expo Go (avoids SDK 53+ push warning).
    if (!enabled || isExpoGo) return;

    const Notifications = await getNotifications();
    if (!Notifications) return;
    const permission = await requestPermission(Notifications);
    if (permission.granted) {
      await scheduleDaily(
        Number.isFinite(hour) ? hour : DEFAULT_HOUR,
        Number.isFinite(minute) ? minute : DEFAULT_MINUTE
      );
    }
  },

  setEnabled: async (enabled) => {
    if (enabled) {
      await SecureStore.setItemAsync(ENABLED_KEY, "1");
      set({ enabled: true });

      if (isExpoGo) {
        return {
          ok: true,
          limited: true,
          reason:
            "Preference saved. On Android, daily reminders fire in a development or production build — not in Expo Go.",
        };
      }

      const Notifications = await getNotifications();
      if (!Notifications) {
        await SecureStore.setItemAsync(ENABLED_KEY, "0");
        set({ enabled: false });
        return { ok: false, reason: "Notifications are unavailable in this build." };
      }
      const permission = await requestPermission(Notifications);
      if (!permission.granted) {
        await SecureStore.setItemAsync(ENABLED_KEY, "0");
        set({ enabled: false });
        return denialMessage(permission.canAskAgain);
      }
      const { hour, minute } = get();
      await scheduleDaily(hour, minute);
      return { ok: true };
    }

    await SecureStore.setItemAsync(ENABLED_KEY, "0");
    set({ enabled: false });
    if (!isExpoGo) {
      const Notifications = await getNotifications();
      if (Notifications) await cancelScheduled(Notifications);
    }
    return { ok: true };
  },

  setTime: async (hour, minute) => {
    await SecureStore.setItemAsync(HOUR_KEY, String(hour));
    await SecureStore.setItemAsync(MINUTE_KEY, String(minute));
    set({ hour, minute });
    if (get().enabled && !isExpoGo) {
      await scheduleDaily(hour, minute);
    }
  },
}));
