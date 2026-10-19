import { useEffect, useState } from "react";
import { Text, View, Switch, Pressable, Linking, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Screen } from "@/src/components/Screen";
import { Field } from "@/src/components/Field";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { AvatarInitials } from "@/src/components/AvatarInitials";
import { AppHeader } from "@/src/components/AppHeader";
import { signout, exportAccountData, deleteAccount } from "@/src/api/auth.api";
import { useAuthStore } from "@/src/store/auth";
import {
  getBiometricAvailability,
  useLockStore,
  type BiometricAvailability,
} from "@/src/store/lock";
import { useReminderStore, isExpoGo } from "@/src/store/reminders";
import { useAvatarStore } from "@/src/store/avatar";
import { useNotificationsStore } from "@/src/store/notifications";
import { getErrorMessage } from "@/src/api/client";
import { toast } from "@/src/lib/toast";
import { displayName, avatarName } from "@/src/utils/displayName";
import { colors } from "@/src/theme/colors";
import { MEDICAL_DISCLAIMER } from "@/src/constants/disclaimer";
import { ACCOUNT_DELETION_URL, SUPPORT_EMAIL } from "@/src/constants/support";
import { tabBarClearance } from "@/src/constants/tabBar";
import { ReminderTimeBlock } from "@/src/components/ReminderTimeBlock";
import { ReminderTimeSheet } from "@/src/components/ReminderTimeSheet";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center py-3.5">
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.glassStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="font-sansMedium" style={{ color: colors.ink }}>
          {label}
        </Text>
        {value ? (
          <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
            {value}
          </Text>
        ) : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="min-h-[52px]">
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logoutLocal = useAuthStore((s) => s.logoutLocal);
  const clearAvatar = useAvatarStore((s) => s.clear);
  const clearNotifications = useNotificationsStore((s) => s.clear);
  const {
    enabled,
    biometricEnabled,
    enableLock,
    disableLock,
    setBiometricEnabled,
  } = useLockStore();
  const {
    enabled: reminderOn,
    hour,
    minute,
    hydrated: reminderHydrated,
    hydrate: hydrateReminders,
    setEnabled: setReminderEnabled,
    setTime: setReminderTime,
  } = useReminderStore();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<null | "warn" | "confirm">(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [stepUpPassword, setStepUpPassword] = useState("");
  const [bioInfo, setBioInfo] = useState<BiometricAvailability | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [bioOfferOpen, setBioOfferOpen] = useState(false);
  const [notifPermOpen, setNotifPermOpen] = useState(false);
  const [notifPermMessage, setNotifPermMessage] = useState("");

  useEffect(() => {
    if (!reminderHydrated) hydrateReminders();
  }, [reminderHydrated, hydrateReminders]);

  useEffect(() => {
    void getBiometricAvailability().then(setBioInfo);
  }, []);

  async function finishEnableLock(withBiometric: boolean) {
    await enableLock(pin, { enableBiometric: withBiometric });
    setPin("");
    setBioOfferOpen(false);
    setNotice({
      title: "App lock on",
      message: withBiometric
        ? "Journal IQ will ask for biometrics or your PIN after you leave the app. This is device-local and does not protect server data."
        : "Journal IQ will ask for your PIN after you leave the app. This is device-local and does not protect server data.",
    });
  }

  async function onToggleLock(value: boolean) {
    if (value) {
      if (!/^\d{4,6}$/.test(pin)) {
        setNotice({
          title: "Choose a PIN",
          message: "Enter a 4–6 digit PIN below, then turn on app lock.",
        });
        return;
      }
      const avail = await getBiometricAvailability();
      setBioInfo(avail);
      if (avail.hasHardware && avail.enrolled) {
        setBioOfferOpen(true);
      } else {
        await finishEnableLock(false);
      }
    } else {
      await disableLock();
    }
  }

  async function onToggleBiometric(value: boolean) {
    const result = await setBiometricEnabled(value);
    if (!result.ok) {
      toast.error(result.reason || "Couldn’t update biometrics");
      return;
    }
    toast.success(value ? "Biometric unlock on" : "Biometric unlock off");
  }

  async function onToggleReminder(value: boolean) {
    const result = await setReminderEnabled(value);
    if (!result.ok) {
      if (result.openSettings) {
        setNotifPermMessage(result.reason || "Enable notifications to continue.");
        setNotifPermOpen(true);
        return;
      }
      toast.error(result.reason || "Couldn’t enable reminders");
      return;
    }
    if (result.limited && result.reason) {
      toast.info(result.reason);
    } else if (value) {
      toast.success("Daily reminder on");
    } else {
      toast.info("Daily reminder off");
    }
  }

  async function onExportConfirm() {
    if (!stepUpPassword) {
      toast.error("Enter your password to export");
      return;
    }
    setExporting(true);
    try {
      const payload = await exportAccountData(stepUpPassword);
      const path = `${FileSystem.cacheDirectory}journal-iq-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: "application/json",
          dialogTitle: "Export your Journal IQ data",
          UTI: "public.json",
        });
      } else {
        toast.success("Export saved on this device");
      }
      try {
        await FileSystem.deleteAsync(path, { idempotent: true });
      } catch {
        /* best-effort cleanup */
      }
      setExportOpen(false);
      setStepUpPassword("");
    } catch (e) {
      toast.error(getErrorMessage(e, "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  async function confirmDeleteAccount() {
    if (!stepUpPassword) {
      toast.error("Enter your password to delete your account");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(stepUpPassword);
      clearAvatar();
      clearNotifications();
      queryClient.clear();
      await logoutLocal();
      setDeleteStep(null);
      setStepUpPassword("");
      toast.success("Account deleted");
      router.replace("/(auth)/signin");
    } catch (e) {
      toast.error(getErrorMessage(e, "Couldn’t delete account"));
    } finally {
      setDeleting(false);
    }
  }

  async function confirmSignOut() {
    setLoading(true);
    try {
      await signout();
    } catch {
      /* still clear local state */
    } finally {
      clearAvatar();
      clearNotifications();
      queryClient.clear();
      await logoutLocal();
      setLoading(false);
      setSignOutOpen(false);
      router.replace("/(auth)/signin");
    }
  }

  return (
    <Screen>
      <View style={{ paddingBottom: tabBarClearance(insets.bottom) }}>
        <AppHeader showBrand={false} title="Settings" />
        <Text className="font-sans mb-5 -mt-2" style={{ color: colors.muted }}>
          Privacy, reminders, and account
        </Text>

        <GlassCard className="mb-4">
          <Pressable
            onPress={() => router.push("/(app)/profile")}
            className="flex-row items-center"
            accessibilityLabel="View profile"
          >
            <AvatarInitials name={avatarName(user?.name)} size={72} ring />
            <View className="flex-1 ml-4 min-h-[72px] justify-center">
              <Text className="font-sansMedium text-lg" style={{ color: colors.ink }}>
                {displayName(user?.name, "Your profile")}
              </Text>
              <Text className="font-sans mt-0.5" numberOfLines={1} style={{ color: colors.muted }}>
                {user?.email}
              </Text>
              <Text className="font-sansMedium text-sm mt-2" style={{ color: colors.secondary }}>
                View profile ›
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </GlassCard>

        <GlassCard className="mb-4">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-1"
            style={{ color: colors.secondary }}
          >
            Account
          </Text>
          <SettingsRow
            icon="happy-outline"
            label="Mood check-ins"
            value="Quick carousel & week view"
            onPress={() => router.push("/(app)/(tabs)/mood")}
          />
        </GlassCard>

        <GlassCard className="mb-4">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-1"
            style={{ color: colors.secondary }}
          >
            Reminders
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.glassStrong,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-sansMedium" style={{ color: colors.ink }}>
                  Daily nudge
                </Text>
                <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
                  {isExpoGo
                    ? "Saved on device — scheduling needs a build"
                    : "Local reminder on this device"}
                </Text>
              </View>
            </View>
            <Switch
              value={reminderOn}
              onValueChange={onToggleReminder}
              trackColor={{ true: colors.primary, false: "rgba(254,254,254,0.2)" }}
              thumbColor={colors.ink}
            />
          </View>
          {reminderOn ? (
            <ReminderTimeBlock
              hour={hour}
              minute={minute}
              showExpoGoNote={isExpoGo}
              onOpenPicker={() => setTimeSheetOpen(true)}
              onSelectTime={(h, m) => {
                void setReminderTime(h, m);
              }}
            />
          ) : (
            <Text className="font-sans text-sm mb-1" style={{ color: colors.muted }}>
              A quiet daily check-in prompt — no streaks required.
            </Text>
          )}
        </GlassCard>

        <ReminderTimeSheet
          visible={timeSheetOpen}
          hour={hour}
          minute={minute}
          onClose={() => setTimeSheetOpen(false)}
          onSave={(h, m) => {
            void setReminderTime(h, m);
          }}
        />

        <GlassCard className="mb-4">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-1"
            style={{ color: colors.secondary }}
          >
            Security
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.glassStrong,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-sansMedium" style={{ color: colors.ink }}>
                  App lock
                </Text>
                <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
                  Optional PIN on this device only
                </Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggleLock}
              trackColor={{ true: colors.primary, false: "rgba(254,254,254,0.2)" }}
              thumbColor={colors.ink}
              accessibilityLabel="App lock"
            />
          </View>
          {!enabled ? (
            <Field
              label="New PIN (4–6 digits)"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              placeholder="••••"
              keyboardType="number-pad"
            />
          ) : (
            <>
              <Text className="font-sans text-sm mb-2" style={{ color: colors.muted }}>
                Lock is on. Turn off to remove your PIN. Does not protect server data.
              </Text>
              {bioInfo?.hasHardware ? (
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-1 pr-3">
                    <Text className="font-sansMedium" style={{ color: colors.ink }}>
                      Biometrics
                    </Text>
                    <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
                      {bioInfo.enrolled
                        ? "Unlock with biometrics after background"
                        : "Enroll biometrics in system Settings first"}
                    </Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={onToggleBiometric}
                    disabled={!bioInfo.enrolled}
                    trackColor={{ true: colors.primary, false: "rgba(254,254,254,0.2)" }}
                    thumbColor={colors.ink}
                    accessibilityLabel="Unlock with biometrics"
                  />
                </View>
              ) : (
                <Text className="font-sans text-sm mb-1" style={{ color: colors.muted }}>
                  Biometrics are not available on this device.
                </Text>
              )}
            </>
          )}
        </GlassCard>

        <GlassCard className="mb-4">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-1"
            style={{ color: colors.secondary }}
          >
            Your data
          </Text>
          <SettingsRow
            icon="download-outline"
            label="Export data"
            value={exporting ? "Preparing export…" : "Requires password · JSON download"}
            onPress={() => {
              if (exporting) return;
              setStepUpPassword("");
              setExportOpen(true);
            }}
          />
          <View style={{ height: 1, backgroundColor: colors.glassBorder }} />
          <Pressable
            onPress={() => {
              setStepUpPassword("");
              setDeleteStep("warn");
            }}
            disabled={deleting}
            className="min-h-[52px] flex-row items-center py-3.5"
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "rgba(255,138,138,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF8A8A" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-sansMedium" style={{ color: "#FF8A8A" }}>
                {deleting ? "Deleting…" : "Delete account"}
              </Text>
              <Text className="font-sans text-sm mt-0.5" style={{ color: colors.muted }}>
                Requires password · permanently erase everything
              </Text>
            </View>
          </Pressable>
        </GlassCard>

        <GlassCard className="mb-6">
          <Text
            className="font-sansMedium text-xs tracking-widest uppercase mb-1"
            style={{ color: colors.secondary }}
          >
            Privacy
          </Text>
          <Text className="font-sans text-sm leading-5 mb-2" style={{ color: colors.muted }}>
            {MEDICAL_DISCLAIMER} Entries and moods stay private to your account. AI reflections never
            diagnose. Support: {SUPPORT_EMAIL}
          </Text>
          <SettingsRow
            icon="document-text-outline"
            label="Privacy Policy"
            value="What we collect & how AI is used"
            onPress={() => router.push("/(legal)/privacy")}
          />
          <View style={{ height: 1, backgroundColor: colors.glassBorder }} />
          <SettingsRow
            icon="reader-outline"
            label="Terms of Service"
            value="Not medical advice · your rights"
            onPress={() => router.push("/(legal)/terms")}
          />
          {ACCOUNT_DELETION_URL ? (
            <>
              <View style={{ height: 1, backgroundColor: colors.glassBorder }} />
              <SettingsRow
                icon="globe-outline"
                label="Delete account online"
                value="Web request without reinstalling"
                onPress={() => {
                  void Linking.openURL(ACCOUNT_DELETION_URL);
                }}
              />
            </>
          ) : null}
          <View style={{ height: 1, backgroundColor: colors.glassBorder }} />
          <SettingsRow
            icon="mail-outline"
            label="Contact support"
            value={SUPPORT_EMAIL}
            onPress={() => {
              void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
            }}
          />
        </GlassCard>

        <Button
          title="Sign out"
          onPress={() => setSignOutOpen(true)}
          loading={loading}
          variant="secondary"
        />

        <ConfirmDialog
          visible={!!notice}
          title={notice?.title || ""}
          message={notice?.message || ""}
          confirmLabel="OK"
          hideCancel
          onConfirm={() => setNotice(null)}
          onCancel={() => setNotice(null)}
        />

        <ConfirmDialog
          visible={bioOfferOpen}
          title="Enable biometrics?"
          message="Also unlock with biometrics? You can change this later in Settings."
          confirmLabel="Use biometrics"
          cancelLabel="PIN only"
          onConfirm={() => void finishEnableLock(true)}
          onCancel={() => void finishEnableLock(false)}
        />

        <ConfirmDialog
          visible={notifPermOpen}
          title="Reminders need permission"
          message={notifPermMessage}
          confirmLabel="Open Settings"
          cancelLabel="Not now"
          onConfirm={() => {
            setNotifPermOpen(false);
            void Linking.openSettings();
          }}
          onCancel={() => setNotifPermOpen(false)}
        />

        <ConfirmDialog
          visible={signOutOpen}
          title="Sign out?"
          message="You’ll need your password to sign back in."
          confirmLabel="Sign out"
          cancelLabel="Cancel"
          destructive
          loading={loading}
          onConfirm={confirmSignOut}
          onCancel={() => {
            if (!loading) setSignOutOpen(false);
          }}
        />

        <ConfirmDialog
          visible={exportOpen}
          title="Export your data?"
          message="Enter your account password to download journals, moods, and insights as JSON."
          confirmLabel="Export"
          cancelLabel="Cancel"
          loading={exporting}
          onConfirm={onExportConfirm}
          onCancel={() => {
            if (!exporting) {
              setExportOpen(false);
              setStepUpPassword("");
            }
          }}
        >
          <TextInput
            value={stepUpPassword}
            onChangeText={setStepUpPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={{
              marginTop: 12,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.ink,
              fontFamily: "DMSans_400Regular",
            }}
          />
        </ConfirmDialog>

        <ConfirmDialog
          visible={deleteStep === "warn"}
          title="Delete account?"
          message="This permanently removes your journals, moods, insights, and login. This cannot be undone."
          confirmLabel="Continue"
          cancelLabel="Cancel"
          destructive
          onConfirm={() => setDeleteStep("confirm")}
          onCancel={() => {
            setDeleteStep(null);
            setStepUpPassword("");
          }}
        />

        <ConfirmDialog
          visible={deleteStep === "confirm"}
          title="Confirm with password"
          message="Enter your password to permanently erase your account."
          confirmLabel="Yes, delete"
          cancelLabel="Cancel"
          destructive
          loading={deleting}
          onConfirm={confirmDeleteAccount}
          onCancel={() => {
            if (!deleting) {
              setDeleteStep(null);
              setStepUpPassword("");
            }
          }}
        >
          <TextInput
            value={stepUpPassword}
            onChangeText={setStepUpPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={{
              marginTop: 12,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.ink,
              fontFamily: "DMSans_400Regular",
            }}
          />
        </ConfirmDialog>
      </View>
    </Screen>
  );
}
