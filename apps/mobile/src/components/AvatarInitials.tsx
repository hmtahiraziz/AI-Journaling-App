import { Text, View, Image } from "react-native";
import { colors } from "@/src/theme/colors";
import { useAvatarStore } from "@/src/store/avatar";

export function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  let raw = name.trim();
  if (raw.includes("@")) raw = raw.split("@")[0] || raw;
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type Props = {
  name?: string | null;
  size?: number;
  ring?: boolean;
  /** Override store URI (optional) */
  uri?: string | null;
};

export function AvatarInitials({ name, size = 56, ring, uri }: Props) {
  const storeUri = useAvatarStore((s) => s.uri);
  const photo = uri !== undefined ? uri : storeUri;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.glassStrong,
        borderWidth: ring ? 2 : 1,
        borderColor: ring ? colors.primary : colors.glassBorder,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text
          className="font-sansMedium"
          style={{ color: colors.primary, fontSize: size * 0.34 }}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
