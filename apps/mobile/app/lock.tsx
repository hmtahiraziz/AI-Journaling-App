import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { BrandMark } from "@/src/components/BrandMark";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import {
  getBiometricAvailability,
  useLockStore,
  type BiometricAvailability,
} from "@/src/store/lock";
import { colors } from "@/src/theme/colors";

export default function LockScreen() {
  const router = useRouter();
  const { unlockWithPin, unlockWithBiometric, biometricEnabled, lockoutUntil } = useLockStore();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [bio, setBio] = useState<BiometricAvailability | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const goHome = useCallback(() => {
    router.replace("/(app)/(tabs)/home");
  }, [router]);

  const tryBiometric = useCallback(async () => {
    if (!biometricEnabled || lockoutUntil > Date.now()) return;
    setBioBusy(true);
    try {
      const ok = await unlockWithBiometric();
      if (ok) goHome();
    } finally {
      setBioBusy(false);
    }
  }, [biometricEnabled, lockoutUntil, unlockWithBiometric, goHome]);

  useEffect(() => {
    void getBiometricAvailability().then(setBio);
  }, []);

  useEffect(() => {
    if (!biometricEnabled) return;
    const t = setTimeout(() => {
      void tryBiometric();
    }, 350);
    return () => clearTimeout(t);
  }, [biometricEnabled, tryBiometric]);

  async function onPin() {
    setLoading(true);
    const result = await unlockWithPin(pin);
    setLoading(false);
    if (result.ok) {
      goHome();
      return;
    }
    setPin("");
    if (result.lockedOut) {
      const secs = Math.ceil((result.waitMs || 60000) / 1000);
      setNotice({
        title: "Too many attempts",
        message: `Try again in about ${secs} seconds.`,
      });
      return;
    }
    setNotice({
      title: "Incorrect PIN",
      message: "That PIN doesn’t match. Please try again.",
    });
  }

  const showBioButton =
    biometricEnabled && bio?.hasHardware && bio?.enrolled && lockoutUntil <= Date.now();

  return (
    <Screen scroll={false} ambient="subtle">
      <View className="flex-1 justify-center">
        <BrandMark dense />
        <Text className="text-center font-sans mt-5 mb-2" style={{ color: colors.muted }}>
          App lock is on
        </Text>
        <Text
          className="text-center font-sans text-xs mb-4 px-4"
          style={{ color: colors.muted }}
        >
          Device-local only — this does not protect data on the server.
        </Text>
        <GlassCard className="mb-4">
          {showBioButton ? (
            <>
              <Button
                title={bioBusy ? "Checking biometrics…" : "Unlock with biometrics"}
                onPress={() => void tryBiometric()}
                loading={bioBusy}
              />
              <View className="h-4" />
              <Text
                className="font-sans text-xs text-center mb-3"
                style={{ color: colors.muted }}
              >
                Or enter your PIN
              </Text>
            </>
          ) : null}
          <Field
            label="PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            placeholder="••••"
            keyboardType="number-pad"
          />
          <Button title="Unlock with PIN" onPress={onPin} loading={loading} />
        </GlassCard>
      </View>

      <ConfirmDialog
        visible={!!notice}
        title={notice?.title || ""}
        message={notice?.message || ""}
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setNotice(null)}
        onCancel={() => setNotice(null)}
      />
    </Screen>
  );
}
