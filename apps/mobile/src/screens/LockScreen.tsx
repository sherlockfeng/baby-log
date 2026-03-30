import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppLock } from "../context/AppLock";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";

export function LockScreen() {
  const { unlock } = useAppLock();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} testID={TID.lock.screen}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="lock" size={40} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title}>{t("lock.title")}</Text>
        <Text style={styles.subtitle}>{t("lock.subtitle")}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => unlock()}
          testID={TID.lock.unlockButton}
        >
          <Text style={styles.primaryButtonText}>{t("lock.unlock")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  logoWrap: { marginBottom: spacing.lg },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: borderRadius.button,
    ...shadow.primary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
