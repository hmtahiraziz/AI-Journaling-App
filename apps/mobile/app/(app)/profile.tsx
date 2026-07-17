import { useEffect, useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/src/components/Screen";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { AvatarInitials } from "@/src/components/AvatarInitials";
import { fetchMe, updateProfile } from "@/src/api/auth.api";
import { getErrorMessage } from "@/src/api/client";
import { useAuthStore } from "@/src/store/auth";
import { displayName, avatarName, looksLikeEmail } from "@/src/utils/displayName";
import { showAvatarPicker } from "@/src/store/avatar";
import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";

function formatMemberSince(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(
    looksLikeEmail(user?.name) ? "" : (user?.name ?? "")
  );
  const [timezone, setTimezone] = useState(
    user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [memberSince, setMemberSince] = useState(user?.createdAt);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await fetchMe();
        if (!active) return;
        setName(looksLikeEmail(profile.name) ? "" : profile.name);
        setTimezone(profile.timezone);
        setMemberSince(profile.createdAt);
        setUser(profile);
      } catch (e) {
        if (active) {
          Alert.alert("Couldn’t load profile", getErrorMessage(e));
        }
      } finally {
        if (active) setFetching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setUser]);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter your display name.");
      return;
    }
    const tz = timezone.trim();
    if (!tz) {
      Alert.alert("Timezone required", "Please enter your timezone (e.g. Asia/Kolkata).");
      return;
    }

    setLoading(true);
    try {
      const profile = await updateProfile({ name: trimmed, timezone: tz });
      setUser(profile);
      Alert.alert("Profile updated", "Your changes have been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Couldn’t save", getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const joined = formatMemberSince(memberSince);

  return (
    <Screen ambient="subtle">
      <Pressable onPress={() => router.back()} className="mb-3 min-h-[44px] justify-center">
        <Text className="font-sansMedium" style={{ color: colors.secondary }}>
          ← Back
        </Text>
      </Pressable>

      <Text className="font-display text-3xl mb-1" style={{ color: colors.ink }}>
        Profile
      </Text>
      <Text className="font-sans mb-5" style={{ color: colors.muted }}>
        Your account details
      </Text>

      <GlassCard className="mb-5 items-center" style={{ paddingVertical: 28 }}>
        <Pressable
          onPress={() => {
            if (!user?.id) return;
            showAvatarPicker(user.id);
          }}
          accessibilityLabel="Edit profile photo"
        >
          <View>
            <AvatarInitials name={avatarName(name || user?.name)} size={104} ring />
            <View
              style={{
                position: "absolute",
                right: 2,
                bottom: 2,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colors.night,
              }}
            >
              <Ionicons name="camera" size={15} color={colors.night} />
            </View>
          </View>
        </Pressable>
        <Text className="font-sansMedium text-xl mt-5" style={{ color: colors.ink }}>
          {displayName(name || user?.name, "Your name")}
        </Text>
        <Text className="font-sans mt-1" style={{ color: colors.muted }}>
          {user?.email}
        </Text>
        {joined ? (
          <Text className="font-sans text-sm mt-2" style={{ color: colors.muted }}>
            Member since {joined}
          </Text>
        ) : null}
        <Text className="font-sans text-xs mt-3" style={{ color: colors.muted }}>
          Tap photo to update
        </Text>
      </GlassCard>

      <GlassCard className="mb-6">
        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="How should we greet you?"
          autoCapitalize="words"
        />
        <View className="mb-4">
          <Text className="font-sansMedium text-sm mb-2" style={{ color: colors.muted }}>
            Email
          </Text>
          <View
            className="rounded-2xl px-4 py-3.5 min-h-[52px] justify-center"
            style={{
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <Text className="font-sans text-base" style={{ color: colors.muted }}>
              {user?.email ?? "—"}
            </Text>
          </View>
          <Text className="font-sans text-xs mt-1.5" style={{ color: colors.muted }}>
            Email can’t be changed here.
          </Text>
        </View>
        <Field
          label="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          placeholder="Asia/Kolkata"
          autoCapitalize="none"
        />
        <Text className="font-sans text-xs -mt-2" style={{ color: colors.muted }}>
          Used for daily prompts and weekly insights.
        </Text>
      </GlassCard>

      <Button title="Save changes" onPress={onSave} loading={loading || fetching} />
    </Screen>
  );
}
