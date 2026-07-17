import { useState } from "react";
import { Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { BrandMark } from "@/src/components/BrandMark";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { useLockStore } from "@/src/store/lock";
import { colors } from "@/src/theme/colors";

/** TEMP: App Lock screen unused while feature is disabled in _layout / settings. */
export default function LockScreen() {
  const router = useRouter();
  const { unlockWithPin, unlockWithBiometric } = useLockStore();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function onPin() {
    setLoading(true);
    const ok = await unlockWithPin(pin);
    setLoading(false);
    if (ok) {
      router.replace("/(app)/(tabs)/home");
    } else {
      Alert.alert("Incorrect PIN", "Try again.");
      setPin("");
    }
  }

  async function onBio() {
    const ok = await unlockWithBiometric();
    if (ok) router.replace("/(app)/(tabs)/home");
  }

  return (
    <Screen scroll={false} ambient="subtle">
      <View className="flex-1 justify-center">
        <BrandMark dense />
        <Text className="text-center font-sans mt-5 mb-6" style={{ color: colors.muted }}>
          App lock is on
        </Text>
        <GlassCard className="mb-4">
          <Field
            label="PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            placeholder="••••"
            keyboardType="number-pad"
          />
          <Button title="Unlock" onPress={onPin} loading={loading} />
          <View className="h-3" />
          <Button title="Use biometrics" variant="secondary" onPress={onBio} />
        </GlassCard>
      </View>
    </Screen>
  );
}
