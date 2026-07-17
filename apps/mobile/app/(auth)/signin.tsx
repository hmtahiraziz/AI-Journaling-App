import { useState } from "react";
import { Text, View, Pressable, useWindowDimensions } from "react-native";
import { Link, useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { BrandMark } from "@/src/components/BrandMark";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { signin } from "@/src/api/auth.api";
import { getErrorMessage } from "@/src/api/client";
import { useAuthStore } from "@/src/store/auth";
import { colors } from "@/src/theme/colors";

export default function SignInScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { height } = useWindowDimensions();
  const short = height < 720;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit() {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await signin({ email: email.trim(), password });
      setUser(data.user);
      router.replace("/(app)/(tabs)/home");
    } catch (e) {
      setError(getErrorMessage(e, "Sign in failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]} ambient="subtle">
      <View style={{ paddingBottom: 16 }}>
        <View style={{ marginTop: short ? 4 : 8, marginBottom: short ? 14 : 18 }}>
          <BrandMark dense compact={false} />
        </View>

        <Text
          style={{
            color: colors.ink,
            fontFamily: "Fraunces_600SemiBold",
            fontSize: short ? 24 : 26,
            marginBottom: 4,
          }}
        >
          Welcome back
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: "DMSans_400Regular",
            fontSize: 14,
            marginBottom: short ? 14 : 16,
            lineHeight: 20,
          }}
        >
          Sign in to continue your private journal.
        </Text>

        <GlassCard>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
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

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable
              style={{
                alignSelf: "flex-end",
                minHeight: 40,
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.secondary, fontFamily: "DMSans_500Medium", fontSize: 14 }}>
                Forgot password?
              </Text>
            </Pressable>
          </Link>

          <Button title="Sign in" onPress={onSubmit} loading={loading} />
        </GlassCard>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: short ? 16 : 20,
            flexWrap: "wrap",
          }}
        >
          <Text style={{ color: colors.muted, fontFamily: "DMSans_400Regular" }}>New here? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable hitSlop={8}>
              <Text style={{ color: colors.primary, fontFamily: "DMSans_500Medium" }}>
                Create account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
