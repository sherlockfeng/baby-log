import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
  Pressable,
} from "react-native";
import { KeyboardAvoidingWrapper } from "../components/KeyboardAvoidingWrapper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { setStoredToken } from "../store/token";
import { apiRequest } from "../api/client";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";

type LoginScreenProps = {
  onDone: () => void;
  onGoRegister: () => void;
  onBack?: () => void;
};

export function LoginScreen({ onDone, onGoRegister, onBack }: LoginScreenProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const tk = token.trim();
    if (!tk) {
      setError(t("login.emptyTokenError"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/babies", { method: "GET", token: tk });
      if (res.status === 401) {
        setError(t("login.invalidTokenError"));
        return;
      }
      if (!res.ok) {
        setError(t("common.networkError"));
        return;
      }
      await setStoredToken(tk);
      onDone();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID={TID.login.screen}>
      {onBack ? (
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.closeBtn} hitSlop={12} testID={TID.login.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
      <KeyboardAvoidingWrapper style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="child-care" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>{t("login.title")}</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("login.tokenPlaceholder")}
            placeholderTextColor={colors.placeholder}
            value={token}
            onChangeText={(text) => {
              setToken(text);
              if (error) setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            testID={TID.login.tokenInput}
          />
          {error ? <Text style={styles.error} testID={TID.login.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID={TID.login.submitButton}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? t("login.submitting") : t("login.submit")}
            </Text>
          </Pressable>

          <Pressable
            onPress={onGoRegister}
            style={styles.registerWrap}
            disabled={loading}
            testID={TID.login.goRegisterLink}
          >
            <Text style={styles.registerText}>{t("login.noFamily")}</Text>
            <Text style={styles.registerLink}>{t("login.goRegister")}</Text>
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
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.button,
    alignItems: "center",
    marginTop: spacing.sm,
    ...shadow.primary,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.card,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  registerText: { color: colors.textSecondary, fontSize: 15, marginBottom: 4 },
  registerLink: { color: colors.link, fontSize: 17, fontWeight: "600" },
});
