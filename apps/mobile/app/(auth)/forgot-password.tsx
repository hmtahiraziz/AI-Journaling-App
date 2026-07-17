import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { forgotPassword } from "@/src/api/auth.api";
import { getErrorMessage } from "@/src/api/client";
import { colors } from "@/src/theme/colors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SEC = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function onSubmit() {
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (e) {
      setError(getErrorMessage(e, "Couldn’t send reset link"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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
            Check your email
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
            If an account exists for{" "}
            <Text style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}>{email.trim()}</Text>
            , a reset link is on the way. It expires in one hour.
          </Text>

          <GlassCard>
            <Text
              style={{
                color: colors.muted,
                fontFamily: "DMSans_400Regular",
                fontSize: 14,
                lineHeight: 21,
                marginBottom: 16,
              }}
            >
              Open the email on this phone and tap <Text style={{ color: colors.secondary }}>Reset password</Text>.
              Check spam if you don’t see it within a minute.
            </Text>
            <Button
              title={cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
              onPress={onSubmit}
              loading={loading}
              disabled={cooldown > 0}
              variant="secondary"
            />
            <View style={{ height: 12 }} />
            <Button title="Back to sign in" onPress={() => router.replace("/(auth)/signin")} />
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
          Forgot password
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
          Enter the email for your Journal IQ account. We’ll send a secure link to choose a new
          password.
        </Text>

        <GlassCard>
          <Field
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
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
          <Button title="Send reset link" onPress={onSubmit} loading={loading} />
        </GlassCard>

        <View style={{ marginTop: 16 }}>
          <Button title="Back to sign in" onPress={() => router.back()} variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
