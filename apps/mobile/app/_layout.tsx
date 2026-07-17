import "../global.css";
import "react-native-gesture-handler";
import { useEffect } from "react";
// TEMP: App Lock disabled — restore with useLockStore + AppState listener below
// import { AppState } from "react-native";
import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/auth";
// import { useLockStore } from "@/src/store/lock";
import { useOnboardingStore } from "@/src/store/onboarding";
import { useAvatarStore } from "@/src/store/avatar";
import { useReminderStore } from "@/src/store/reminders";
import { colors } from "@/src/theme/colors";
import { initSentry, withSentry } from "@/src/lib/sentry";
import { extractResetTokenFromUrl, isResetPasswordUrl } from "@/src/utils/resetLink";

initSentry();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function navigateToReset(router: ReturnType<typeof useRouter>, url: string) {
  const token = extractResetTokenFromUrl(url);
  if (!token) {
    router.push("/(auth)/reset-password");
    return;
  }
  router.push({
    pathname: "/(auth)/reset-password",
    params: { token },
  });
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, hydrated, hydrate } = useAuthStore();
  // TEMP: App Lock disabled
  // const { enabled, locked, hydrated: lockHydrated, hydrate: hydrateLock, lock } = useLockStore();
  const {
    completed: onboardingDone,
    hydrated: onboardingHydrated,
    hydrate: hydrateOnboarding,
  } = useOnboardingStore();
  const hydrateAvatar = useAvatarStore((s) => s.hydrate);
  const hydrateReminders = useReminderStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    // hydrateLock();
    hydrateOnboarding();
    hydrateReminders();
  }, [hydrate, hydrateOnboarding, hydrateReminders]);

  useEffect(() => {
    hydrateAvatar(user?.id);
  }, [user?.id, hydrateAvatar]);

  // TEMP: App Lock disabled — background/inactive → lock()
  // useEffect(() => {
  //   const sub = AppState.addEventListener("change", (state) => {
  //     if (state === "background" || state === "inactive") {
  //       lock();
  //     }
  //   });
  //   return () => sub.remove();
  // }, [lock]);

  // Password-reset deep links (journaliq://reset-password?token=…)
  useEffect(() => {
    function handleUrl(url: string | null) {
      if (!url || !isResetPasswordUrl(url)) return;
      navigateToReset(router, url);
    }

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!hydrated || !onboardingHydrated) return;

    const root = segments[0];
    const inAuth = root === "(auth)";
    const inOnboarding = root === "(onboarding)";
    const inLegal = root === "(legal)";
    // const inLock = root === "lock";
    const authScreen = segments[1];
    const onResetPassword = inAuth && authScreen === "reset-password";

    // Allow auth (incl. password reset) + legal even before onboarding finishes.
    if (!onboardingDone && !inOnboarding && !inLegal && !inAuth) {
      router.replace("/(onboarding)");
      return;
    }

    if (onboardingDone && !user && !inAuth && !inOnboarding && !inLegal) {
      router.replace("/(auth)/signin");
      return;
    }

    // TEMP: App Lock disabled — redirect to /lock when locked
    // if (user && enabled && locked && !inLock && !inLegal && !onResetPassword) {
    //   router.replace("/lock");
    //   return;
    // }

    // Don't kick users off the reset-password screen if a stale session exists.
    if (user && (inAuth || inOnboarding) && !inLegal && !onResetPassword) {
      router.replace("/(app)/(tabs)/home");
    }
  }, [
    user,
    hydrated,
    onboardingHydrated,
    onboardingDone,
    // enabled,
    // locked,
    // lockHydrated,
    segments,
    router,
  ]);

  return <>{children}</>;
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.night },
              }}
            >
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(legal)" />
              {/* TEMP: App Lock disabled */}
              {/* <Stack.Screen name="lock" options={{ animation: "fade" }} /> */}
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default withSentry(RootLayout);
