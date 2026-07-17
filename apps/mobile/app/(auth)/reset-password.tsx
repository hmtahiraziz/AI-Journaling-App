import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { resetPassword } from "@/src/api/auth.api";
import { getErrorMessage } from "@/src/api/client";
import { colors } from "@/src/theme/colors";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => firstParam(params.token).trim(), [params.token]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError("");
    if (!token) {
      setError(
        "Missing reset link. Open the email on this phone and tap Reset password."
      );
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(getErrorMessage(e, "Reset failed"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Screen scroll edges={["top", "left", "right", "bottom"]}>
        <View style={{ paddingBottom: 24 }}>
          <Text
            style={{
              color: colors.ink,
              fontFamily: "Fraunces_600SemiBold",
              fontSize: 28,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Password updated
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontFamily: "DMSans_400Regular",
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            You can sign in with your new password. For security, other sessions on this account
            were signed out.
          </Text>
          <GlassCard>
            <Button title="Sign in" onPress={() => router.replace("/(auth)/signin")} />
          </GlassCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]}>
      <View style={{ paddingBottom: 24 }}>
        <Text
          style={{
            color: colors.ink,
            fontFamily: "Fraunces_600SemiBold",
            fontSize: 28,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Choose a new password
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: "DMSans_400Regular",
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {token
            ? "Use at least 8 characters. Confirm it below to finish."
            : "Waiting for a valid reset link. Open the email on this device with Journal IQ installed."}
        </Text>
        <GlassCard>
          <Field
            label="New password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError("");
            }}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              if (error) setError("");
            }}
            secureTextEntry
            placeholder="Repeat password"
          />
          {error ? (
            <Text
              style={{
                color: "#FF8A8A",
                fontFamily: "DMSans_400Regular",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          ) : null}
          <Button
            title="Update password"
            onPress={onSubmit}
            loading={loading}
            disabled={!token}
          />
          {!token ? (
            <View style={{ marginTop: 12 }}>
              <Button
                title="Request a new link"
                variant="ghost"
                onPress={() => router.replace("/(auth)/forgot-password")}
              />
            </View>
          ) : null}
        </GlassCard>
      </View>
    </Screen>
  );
}
