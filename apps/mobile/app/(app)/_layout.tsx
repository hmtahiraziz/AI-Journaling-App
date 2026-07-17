import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="write" options={{ presentation: "card" }} />
      <Stack.Screen name="profile" options={{ presentation: "card" }} />
      <Stack.Screen name="entry/[id]" />
    </Stack>
  );
}
