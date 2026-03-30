import React from "react";
import { Image, Pressable, StyleSheet, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { colors, spacing, borderRadius } from "../theme";
import { TID } from "../testids";

interface Props {
  photos: ImagePicker.ImagePickerAsset[];
  onChange: (photos: ImagePicker.ImagePickerAsset[]) => void;
  max?: number;
}

export function PhotoPicker({ photos, onChange, max = 9 }: Props) {
  const { t } = useTranslation();

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: max - photos.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      onChange([...photos, ...result.assets].slice(0, max));
    }
  };

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container} testID={TID.photo.picker}>
      <View style={styles.row}>
        {photos.map((asset, idx) => (
          <View key={idx} style={styles.thumbWrap}>
            <Image source={{ uri: asset.uri }} style={styles.thumb} />
            <Pressable style={styles.removeBtn} onPress={() => handleRemove(idx)} testID={TID.photo.removeButton(idx)}>
              <MaterialIcons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {photos.length < max && (
          <Pressable style={styles.addBtn} onPress={handlePick} testID={TID.photo.addButton}>
            <MaterialIcons name="add-a-photo" size={24} color={colors.textSecondary} />
            <Text style={styles.addText}>{t("quickAdd.addPhoto")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  thumbWrap: { position: "relative" },
  thumb: { width: 72, height: 72, borderRadius: borderRadius.input, backgroundColor: colors.backgroundSecondary },
  removeBtn: {
    position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.error, justifyContent: "center", alignItems: "center",
  },
  addBtn: {
    width: 72, height: 72, borderRadius: borderRadius.input,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary,
  },
  addText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
});
