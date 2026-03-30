import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTimer } from "./TimerContext";
import { colors, spacing } from "../theme";
import { TID } from "../testids";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerBar() {
  const { t } = useTranslation();
  const { timer, stopTimer } = useTimer();

  if (!timer.active) return null;

  const typeLabel = timer.type === "feed" ? t("quickAdd.feed") : t("quickAdd.sleep");

  return (
    <View style={styles.bar} testID={TID.timer.bar}>
      <MaterialIcons name="timer" size={18} color="#FFFFFF" />
      <Text style={styles.label} testID={TID.timer.label}>
        {typeLabel} · {formatElapsed(timer.elapsed)}
      </Text>
      <Pressable style={styles.stopBtn} onPress={stopTimer} testID={TID.timer.stopButton}>
        <MaterialIcons name="stop-circle" size={20} color="#FFFFFF" />
        <Text style={styles.stopText}>{t("quickAdd.stopTimer")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5C9B5C",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  label: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    gap: 4,
  },
  stopText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
});
