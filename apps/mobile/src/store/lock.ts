import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";

const LOCK_ENABLED_KEY = "jiq_lock_enabled";
const PIN_HASH_KEY = "jiq_pin_hash";
const FAIL_COUNT_KEY = "jiq_lock_fails";
const LOCKOUT_UNTIL_KEY = "jiq_lock_until";
const BIOMETRIC_ENABLED_KEY = "jiq_biometric_enabled";

function secureOpts(): SecureStore.SecureStoreOptions | undefined {
  if (!("WHEN_UNLOCKED_THIS_DEVICE_ONLY" in SecureStore)) return undefined;
  return {
    keychainAccessible: (SecureStore as typeof SecureStore & {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: number;
    }).WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export type BiometricAvailability = {
  hasHardware: boolean;
  enrolled: boolean;
  /** Always generic — never brand as Face ID. */
  label: "Biometrics";
};

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  return { hasHardware, enrolled, label: "Biometrics" };
}

type LockState = {
  enabled: boolean;
  biometricEnabled: boolean;
  locked: boolean;
  hydrated: boolean;
  failCount: number;
  lockoutUntil: number;
  hydrate: () => Promise<void>;
  enableLock: (pin: string, opts?: { enableBiometric?: boolean }) => Promise<void>;
  disableLock: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<{ ok: boolean; reason?: string }>;
  lock: () => void;
  unlockWithPin: (pin: string) => Promise<{ ok: boolean; lockedOut?: boolean; waitMs?: number }>;
  unlockWithBiometric: () => Promise<boolean>;
};

async function hashPin(pin: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `journaliq:${pin}`);
}

export const useLockStore = create<LockState>((set, get) => ({
  enabled: false,
  biometricEnabled: false,
  locked: false,
  hydrated: false,
  failCount: 0,
  lockoutUntil: 0,
  hydrate: async () => {
    const enabled = (await SecureStore.getItemAsync(LOCK_ENABLED_KEY)) === "1";
    const biometricEnabled = (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "1";
    const failRaw = await SecureStore.getItemAsync(FAIL_COUNT_KEY);
    const untilRaw = await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY);
    set({
      enabled,
      biometricEnabled: enabled && biometricEnabled,
      locked: enabled,
      hydrated: true,
      failCount: failRaw ? Number(failRaw) || 0 : 0,
      lockoutUntil: untilRaw ? Number(untilRaw) || 0 : 0,
    });
  },
  enableLock: async (pin, options) => {
    const pinHash = await hashPin(pin);
    const opts = secureOpts();
    await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash, opts);
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, "1", opts);
    await SecureStore.deleteItemAsync(FAIL_COUNT_KEY);
    await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);

    let biometricEnabled = false;
    if (options?.enableBiometric) {
      const avail = await getBiometricAvailability();
      if (avail.hasHardware && avail.enrolled) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "1", opts);
        biometricEnabled = true;
      }
    } else {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "0", opts);
    }

    set({ enabled: true, biometricEnabled, locked: false, failCount: 0, lockoutUntil: 0 });
  },
  disableLock: async () => {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, "0", secureOpts());
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "0", secureOpts());
    await SecureStore.deleteItemAsync(FAIL_COUNT_KEY);
    await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
    set({ enabled: false, biometricEnabled: false, locked: false, failCount: 0, lockoutUntil: 0 });
  },
  setBiometricEnabled: async (enabled) => {
    if (!get().enabled) {
      return { ok: false, reason: "Turn on app lock with a PIN first." };
    }
    if (enabled) {
      const avail = await getBiometricAvailability();
      if (!avail.hasHardware) {
        return { ok: false, reason: "This device does not support biometrics." };
      }
      if (!avail.enrolled) {
        return {
          ok: false,
          reason: `Add ${avail.label.toLowerCase()} in system Settings, then try again.`,
        };
      }
      // Confirm the user can authenticate before enabling.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometrics for Journal IQ",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });
      if (!result.success) {
        return { ok: false, reason: "Biometric confirmation was cancelled." };
      }
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "1", secureOpts());
      set({ biometricEnabled: true });
      return { ok: true };
    }
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "0", secureOpts());
    set({ biometricEnabled: false });
    return { ok: true };
  },
  lock: () => {
    if (get().enabled) set({ locked: true });
  },
  unlockWithPin: async (pin) => {
    const until = get().lockoutUntil;
    if (until > Date.now()) {
      return { ok: false, lockedOut: true, waitMs: until - Date.now() };
    }

    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    const pinHash = await hashPin(pin);
    if (stored && stored === pinHash) {
      await SecureStore.deleteItemAsync(FAIL_COUNT_KEY);
      await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
      set({ locked: false, failCount: 0, lockoutUntil: 0 });
      return { ok: true };
    }

    const nextFails = get().failCount + 1;
    if (nextFails >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_MS;
      const opts = secureOpts();
      await SecureStore.setItemAsync(FAIL_COUNT_KEY, "0", opts);
      await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(lockoutUntil), opts);
      set({ failCount: 0, lockoutUntil });
      return { ok: false, lockedOut: true, waitMs: LOCKOUT_MS };
    }
    await SecureStore.setItemAsync(FAIL_COUNT_KEY, String(nextFails), secureOpts());
    set({ failCount: nextFails });
    return { ok: false };
  },
  unlockWithBiometric: async () => {
    if (!get().biometricEnabled) return false;
    const until = get().lockoutUntil;
    if (until > Date.now()) return false;

    const avail = await getBiometricAvailability();
    if (!avail.hasHardware || !avail.enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Journal IQ with biometrics",
      cancelLabel: "Use PIN",
      disableDeviceFallback: true,
    });
    if (result.success) {
      await SecureStore.deleteItemAsync(FAIL_COUNT_KEY);
      await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
      set({ locked: false, failCount: 0, lockoutUntil: 0 });
      return true;
    }
    return false;
  },
}));
