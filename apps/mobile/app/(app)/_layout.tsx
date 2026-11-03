import { Stack } from "expo-router";
import { colors } from "@/src/theme/colors";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.night },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="write" options={{ presentation: "card" }} />
      <Stack.Screen
        name="profile"
        options={{
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.night },
        }}
      />
      <Stack.Screen name="notifications" options={{ presentation: "card" }} />
      <Stack.Screen name="entry/[id]" />
    </Stack>
  );
}
