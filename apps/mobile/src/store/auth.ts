import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { AuthUser } from "../api/auth.api";
import { clearTokens, TOKEN_KEYS } from "../api/client";
import { fetchMe } from "../api/auth.api";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  hydrate: () => Promise<void>;
  logoutLocal: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEYS.access);
      if (!token) {
        set({ user: null, hydrated: true });
        return;
      }
      const user = await fetchMe();
      set({ user, hydrated: true });
    } catch {
      await clearTokens();
      set({ user: null, hydrated: true });
    }
  },
  logoutLocal: async () => {
    await clearTokens();
    set({ user: null });
  },
}));
