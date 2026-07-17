import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";

/** TEMP: App Lock is commented out in _layout.tsx + settings.tsx — store kept for restore. */

const LOCK_ENABLED_KEY = "jiq_lock_enabled";
const PIN_HASH_KEY = "jiq_pin_hash";

type LockState = {
  enabled: boolean;
  locked: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  lock: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
};

async function hashPin(pin: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `journaliq:${pin}`);
}

export const useLockStore = create<LockState>((set, get) => ({
  enabled: false,
  locked: false,
  hydrated: false,
  hydrate: async () => {
    const enabled = (await SecureStore.getItemAsync(LOCK_ENABLED_KEY)) === "1";
    set({ enabled, locked: enabled, hydrated: true });
  },
  enableLock: async (pin) => {
    const pinHash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash);
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, "1");
    set({ enabled: true, locked: false });
  },
  disableLock: async () => {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, "0");
    set({ enabled: false, locked: false });
  },
  lock: () => {
    if (get().enabled) set({ locked: true });
  },
  unlockWithPin: async (pin) => {
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    const pinHash = await hashPin(pin);
    if (stored && stored === pinHash) {
      set({ locked: false });
      return true;
    }
    return false;
  },
  unlockWithBiometric: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Journal IQ",
      cancelLabel: "Use PIN",
      disableDeviceFallback: true,
    });
    if (result.success) {
      set({ locked: false });
      return true;
    }
    return false;
  },
}));
