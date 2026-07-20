import { useToastStore, type ToastVariant } from "@/src/store/toast";

type ShowOptions = {
  duration?: number;
};

function show(variant: ToastVariant, message: string, options?: ShowOptions) {
  useToastStore.getState().show({ variant, message, duration: options?.duration });
}

export const toast = {
  success: (message: string, options?: ShowOptions) => show("success", message, options),
  error: (message: string, options?: ShowOptions) => show("error", message, options),
  info: (message: string, options?: ShowOptions) => show("info", message, options),
};
