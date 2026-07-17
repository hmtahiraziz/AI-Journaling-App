import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const KEY = "jiq_onboarding_done";

type OnboardingState = {
  completed: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  hydrated: false,
  hydrate: async () => {
    const value = await SecureStore.getItemAsync(KEY);
    set({ completed: value === "1", hydrated: true });
  },
  complete: async () => {
    await SecureStore.setItemAsync(KEY, "1");
    set({ completed: true });
  },
}));
