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
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";

type WelcomeScreenProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function WelcomeScreen({ onLogin, onRegister }: WelcomeScreenProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} testID={TID.welcome.screen} accessible={false}>
      <View style={styles.content} accessible={false}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="child-care" size={48} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title} testID={TID.welcome.title}>{t("welcome.title")}</Text>
        <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={onLogin}
          testID={TID.welcome.loginButton}
          accessible={true}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t("welcome.login")}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={onRegister}
          testID={TID.welcome.registerButton}
          accessible={true}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>{t("welcome.register")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  logoWrap: {
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xl + spacing.lg,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadow.primary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
});
