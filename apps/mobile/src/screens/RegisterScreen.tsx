import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import { KeyboardAvoidingWrapper } from "../components/KeyboardAvoidingWrapper";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { apiJson } from "../api/client";
import { setStoredToken } from "../store/token";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";
import { useToast } from "../components/Toast";

type RegisterScreenProps = {
  onDone: () => void;
  onBack?: () => void;
};

export function RegisterScreen({ onDone, onBack }: RegisterScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<{ familyId: string; token: string } | null>(null);
  const { toast } = useToast();

  const handleCopyToken = async () => {
    if (!created?.token) return;
    await Clipboard.setStringAsync(created.token);
    setCopied(true);
    toast(t("register.copiedToast"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ familyId: string; token: string }>("/families", {
        method: "POST",
        body: { name: name.trim() || undefined },
      });
      setCreated(data);
      await setStoredToken(data.token);
    } catch (e) {
      Alert.alert(t("register.createFailed"), (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <SafeAreaView style={styles.safe} testID={TID.register.successScreen}>
        <ScrollView
          contentContainerStyle={styles.successContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, styles.logoSuccess]}>
              <MaterialIcons name="check" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title} testID={TID.register.successTitle}>{t("register.successTitle")}</Text>
          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={18} color={colors.error} />
            <Text style={styles.warningBold} testID={TID.register.tokenWarning}>{t("register.warningText")}</Text>
          </View>
          <View style={styles.tokenCard}>
            <Text style={styles.tokenText} selectable testID={TID.register.tokenText}>
              {created.token}
            </Text>
            <Pressable
              style={styles.copyButtonLarge}
              onPress={handleCopyToken}
              testID={TID.register.copyButton}
            >
              <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonLargeText} testID={TID.register.copyStatus}>
                {copied ? t("register.copied") : t("register.copyToken")}
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={onDone}
            testID={TID.register.enterAppButton}
          >
            <Text style={styles.primaryButtonText}>{t("register.enterApp")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID={TID.register.screen}>
      {onBack ? (
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.closeBtn} hitSlop={12} testID={TID.register.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
      <KeyboardAvoidingWrapper style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="group-add" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>{t("register.title")}</Text>
          <Text style={styles.subtitle}>{t("register.subtitle")}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("register.namePlaceholder")}
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
            editable={!loading}
            testID={TID.register.nameInput}
          />

          <Pressable
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
            testID={TID.register.submitButton}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? t("register.submitting") : t("register.submit")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  closeBtn: { padding: spacing.xs },
  container: { flex: 1, justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.lg,
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: spacing.lg },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logoSuccess: { backgroundColor: colors.success },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: "center",
    ...shadow.primary,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  successContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(229,115,115,0.12)",
    borderRadius: borderRadius.input,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  warningBold: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tokenCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.input,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenText: {
    fontFamily: "monospace",
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  copyButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primary,
    gap: 8,
    ...shadow.primary,
  },
  copyButtonLargeText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
