import { useState } from "react";
import { Text, View, Pressable, useWindowDimensions } from "react-native";
import { Link, useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { BrandMark } from "@/src/components/BrandMark";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { signup } from "@/src/api/auth.api";
import { getErrorMessage } from "@/src/api/client";
import { useAuthStore } from "@/src/store/auth";
import { colors } from "@/src/theme/colors";
import { MEDICAL_DISCLAIMER, MEDICAL_DISCLAIMER_SHORT } from "@/src/constants/disclaimer";

export default function SignUpScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { height } = useWindowDimensions();
  const short = height < 720;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function onSubmit() {
    setError("");
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Name, email, and a password of at least 8 characters are required.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }
    setLoading(true);
    try {
      const data = await signup({ name: name.trim(), email: email.trim(), password });
      setUser(data.user);
      router.replace("/(app)/(tabs)/home");
    } catch (e) {
      setError(getErrorMessage(e, "Sign up failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={["top", "left", "right", "bottom"]} ambient="subtle">
      <View style={{ paddingBottom: 16 }}>
        <View style={{ marginTop: short ? 4 : 8, marginBottom: short ? 12 : 16 }}>
          <BrandMark dense />
        </View>

        <Text
          style={{
            color: colors.ink,
            fontFamily: "Fraunces_600SemiBold",
            fontSize: short ? 24 : 26,
            marginBottom: 4,
          }}
        >
          Create your space
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: "DMSans_400Regular",
            fontSize: 14,
            marginBottom: short ? 12 : 16,
            lineHeight: 20,
          }}
        >
          Private entries. Gentle reflections. Your pace.
        </Text>
        <Text
          style={{
            color: colors.secondary,
            fontFamily: "DMSans_500Medium",
            fontSize: 12,
            lineHeight: 17,
            marginBottom: short ? 12 : 16,
          }}
        >
          {MEDICAL_DISCLAIMER_SHORT}
        </Text>

        <GlassCard>
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="How should we greet you?"
          />
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
            placeholder="At least 8 characters"
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 14,
              gap: 10,
            }}
          >
            <Pressable
              onPress={() => setAgreed((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              hitSlop={6}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                marginTop: 1,
                borderWidth: 1.5,
                borderColor: agreed ? colors.primary : "rgba(254,254,254,0.35)",
                backgroundColor: agreed ? colors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {agreed ? (
                <Text style={{ color: colors.night, fontSize: 13, fontFamily: "DMSans_700Bold" }}>
                  ✓
                </Text>
              ) : null}
            </Pressable>
            <Text
              style={{
                flex: 1,
                color: colors.muted,
                fontFamily: "DMSans_400Regular",
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              I agree to the{" "}
              <Text
                onPress={() => router.push("/(legal)/privacy")}
                style={{ color: colors.secondary, fontFamily: "DMSans_500Medium" }}
              >
                Privacy Policy
              </Text>{" "}
              and{" "}
              <Text
                onPress={() => router.push("/(legal)/terms")}
                style={{ color: colors.secondary, fontFamily: "DMSans_500Medium" }}
              >
                Terms of Service
              </Text>
              . {MEDICAL_DISCLAIMER}
            </Text>
          </View>
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
          <Button title="Sign up" onPress={onSubmit} loading={loading} disabled={!agreed} />
        </GlassCard>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: short ? 16 : 20,
            flexWrap: "wrap",
          }}
        >
          <Text style={{ color: colors.muted, fontFamily: "DMSans_400Regular" }}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/signin" asChild>
            <Pressable hitSlop={8}>
              <Text style={{ color: colors.primary, fontFamily: "DMSans_500Medium" }}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
