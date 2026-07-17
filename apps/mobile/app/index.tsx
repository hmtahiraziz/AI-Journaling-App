import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { useOnboardingStore } from "@/src/store/onboarding";

export default function Index() {
  const { user, hydrated } = useAuthStore();
  const { completed, hydrated: onboardingHydrated } = useOnboardingStore();

  if (!hydrated || !onboardingHydrated) return null;
  if (!completed) return <Redirect href="/(onboarding)" />;
  if (user) return <Redirect href="/(app)/(tabs)/home" />;
  return <Redirect href="/(auth)/signin" />;
}
