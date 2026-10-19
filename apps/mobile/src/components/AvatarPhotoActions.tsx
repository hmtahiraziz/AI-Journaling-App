import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { Button } from "@/src/components/Button";
import { pickFromCamera, useAvatarStore } from "@/src/store/avatar";
import { colors } from "@/src/theme/colors";
import { toast } from "@/src/lib/toast";

type Props = {
  userId: string;
};

export function AvatarPhotoActions({ userId }: Props) {
  const uri = useAvatarStore((s) => s.uri);
  const pickAndSave = useAvatarStore((s) => s.pickAndSave);
  const remove = useAvatarStore((s) => s.remove);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ alignSelf: "stretch", width: "100%", marginTop: 20, gap: 8 }}>
      <Button
        title="Photo library"
        variant="secondary"
        disabled={busy}
        onPress={() => run(() => pickAndSave(userId))}
      />
      {Platform.OS !== "web" ? (
        <Button
          title="Take photo"
          variant="secondary"
          disabled={busy}
          onPress={() => run(() => pickFromCamera(userId))}
        />
      ) : null}
      {uri ? (
        <Button
          title="Remove photo"
          variant="ghost"
          disabled={busy}
          onPress={() =>
            run(async () => {
              await remove(userId);
              toast.success("Profile photo removed");
            })
          }
        />
      ) : null}
      {!uri ? (
        <Text className="font-sans text-xs text-center mt-1" style={{ color: colors.muted }}>
          Optional — stored only on this device
        </Text>
      ) : null}
    </View>
  );
}
