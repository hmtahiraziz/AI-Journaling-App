import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastPayload = {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
};

type ToastState = {
  current: ToastPayload | null;
  show: (input: { variant: ToastVariant; message: string; duration?: number }) => void;
  hide: () => void;
};

let seq = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  current: null,

  show: ({ variant, message, duration = 2600 }) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    const id = ++seq;
    set({
      current: {
        id,
        variant,
        message: message.trim() || "Something went wrong",
        duration,
      },
    });
    hideTimer = setTimeout(() => {
      const state = useToastStore.getState();
      if (state.current?.id === id) {
        set({ current: null });
      }
      hideTimer = null;
    }, duration);
  },

  hide: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ current: null });
  },
}));
