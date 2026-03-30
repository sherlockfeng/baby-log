import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  SafeAreaView,
  Switch,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getStoredToken } from "../store/token";
import { getFaceIdEnabled, setFaceIdEnabled } from "../store/settings";
import { getProfile, setNickname, setAvatarUri } from "../store/profile";
import { apiJson, apiRequest } from "../api/client";
import { getLanguagePref, setLanguagePref, type LanguagePref } from "../i18n";
import { useTheme, type ThemePref } from "../context/ThemeContext";
import type { Baby } from "@babylog/shared-types";
import { API_BASE_URL } from "../config";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";
import { DatePicker } from "../components/DatePicker";
import { useToast } from "../components/Toast";
import { apiUpload } from "../api/client";

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const LANG_OPTIONS: { key: LanguagePref; labelKey: string }[] = [
  { key: "zh", labelKey: "settings.langZh" },
  { key: "en", labelKey: "settings.langEn" },
  { key: "system", labelKey: "settings.langSystem" },
];

const THEME_OPTIONS: { key: ThemePref; labelKey: string }[] = [
  { key: "light", labelKey: "settings.themeLight" },
  { key: "dark", labelKey: "settings.themeDark" },
  { key: "system", labelKey: "settings.themeSystem" },
];

export function SettingsScreen({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { themePref, setThemePref } = useTheme();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: faceIdEnabled, refetch: refetchFaceId } = useQuery({
    queryKey: ["faceIdEnabled"],
    queryFn: getFaceIdEnabled,
  });
  const { data: babies } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });

  const [faceIdToggle, setFaceIdToggle] = useState(!!faceIdEnabled);
  const [newBabyName, setNewBabyName] = useState("");
  const [newBabyBirth, setNewBabyBirth] = useState("");
  const [langPref, setLangPref] = useState<LanguagePref>("system");
  const [nickname, setNicknameState] = useState("");
  const [avatarUri, setAvatarUriState] = useState("");
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);

  useEffect(() => {
    if (faceIdEnabled !== undefined) setFaceIdToggle(faceIdEnabled);
  }, [faceIdEnabled]);

  useEffect(() => {
    getLanguagePref().then(setLangPref);
    getProfile().then((p) => { setNicknameState(p.nickname); setAvatarUriState(p.avatarUri); });
  }, []);

  const setFaceId = useMutation({
    mutationFn: setFaceIdEnabled,
    onSuccess: () => { refetchFaceId(); queryClient.invalidateQueries({ queryKey: ["faceIdEnabled"] }); },
  });

  const createBaby = useMutation({
    mutationFn: async (body: { name: string; birthDate: string }) =>
      apiJson<Baby>("/babies", { method: "POST", token: token ?? undefined, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["babies"] });
      setNewBabyName(""); setNewBabyBirth("");
      toast(t("settings.addSuccess"));
    },
    onError: (e: Error) => toast(e.message || t("settings.addFailed"), "error"),
  });

  const deleteBaby = useMutation({
    mutationFn: async (babyId: string) => {
      const res = await apiRequest(`/babies/${babyId}`, { method: "DELETE", token: token ?? undefined });
      if (!res.ok) throw new Error(t("settings.babyDeleteFailed"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["babies"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast(t("settings.babyDeleted"));
    },
    onError: (e: Error) => toast(e.message || t("settings.babyDeleteFailed"), "error"),
  });

  const patchBaby = useMutation({
    mutationFn: async ({ babyId, body }: { babyId: string; body: Record<string, unknown> }) =>
      apiJson<Baby>(`/babies/${babyId}`, { method: "PATCH", token: token ?? undefined, body }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["babies"] });
      setEditingBaby(updated);
      toast(t("settings.profileSaved"));
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const handleBabyAvatarUpload = async (baby: Baby) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() || "jpg";
      const uploaded = await apiUpload("/upload", [{ uri: asset.uri, name: `avatar.${ext}`, type: asset.mimeType || "image/jpeg" }], token);
      if (uploaded.files[0]) {
        patchBaby.mutate({ babyId: baby.id, body: { avatarUrl: uploaded.files[0].url } });
      }
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    }
  };

  const handleFaceIdToggle = (value: boolean) => { setFaceIdToggle(value); setFaceId.mutate(value); };

  const handleAddBaby = () => {
    if (!newBabyName.trim()) { Alert.alert(t("settings.promptTitle"), t("settings.enterNamePrompt")); return; }
    const birth = newBabyBirth.trim() || formatDateYYYYMMDD(new Date());
    createBaby.mutate({ name: newBabyName.trim(), birthDate: birth });
  };

  const handleDeleteBaby = (baby: Baby) => {
    Alert.alert(t("settings.deleteBabyTitle"), t("settings.deleteBabyMsg", { name: baby.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteBaby.mutate(baby.id) },
    ]);
  };

  const handleNicknameBlur = async () => {
    const trimmed = nickname.trim();
    setNicknameState(trimmed);
    await setNickname(trimmed);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    if (trimmed) toast(t("settings.profileSaved"));
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUriState(uri);
      await setAvatarUri(uri);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast(t("settings.profileSaved"));
    }
  };

  const handleLanguageChange = async (pref: LanguagePref) => {
    setLangPref(pref);
    await setLanguagePref(pref);
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text }];

  return (
    <SafeAreaView style={styles.safe} testID={TID.settings.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t("settings.title")}</Text>

        {/* Section 1: 应用设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} testID={TID.settings.sectionApp}>{t("settings.appSettings")}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t("settings.faceId")}</Text>
              <Switch
                value={faceIdToggle} onValueChange={handleFaceIdToggle}
                trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF"
                testID={TID.settings.faceIdSwitch}
              />
            </View>
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <Text style={styles.rowLabel}>{t("settings.language")}</Text>
            </View>
            <View style={styles.langRow}>
              {LANG_OPTIONS.map(({ key, labelKey }) => (
                <Pressable
                  key={key}
                  style={[styles.langChip, langPref === key && styles.langChipSelected]}
                  onPress={() => handleLanguageChange(key)}
                  testID={TID.settings.languageSelect(key)}
                >
                  <Text style={[styles.langChipText, langPref === key && styles.langChipTextSelected]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <Text style={styles.rowLabel}>{t("settings.theme")}</Text>
            </View>
            <View style={styles.langRow}>
              {THEME_OPTIONS.map(({ key, labelKey }) => (
                <Pressable
                  key={key}
                  style={[styles.langChip, themePref === key && styles.langChipSelected]}
                  onPress={() => setThemePref(key)}
                  testID={TID.settings.themeSelect(key)}
                >
                  <Text style={[styles.langChipText, themePref === key && styles.langChipTextSelected]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Section 2: 我的资料 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} testID={TID.settings.sectionProfile}>{t("settings.profile")}</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Pressable onPress={handlePickAvatar} testID={TID.settings.changeAvatarButton}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} testID={TID.settings.avatarImage} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarPlaceholder]} testID={TID.settings.avatarImage}>
                    <MaterialIcons name="person" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.changeAvatarText}>{t("settings.changeAvatar")}</Text>
              </Pressable>
              <View style={styles.nicknameCol}>
                <Text style={styles.rowLabel}>{t("settings.nickname")}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, marginBottom: 0 }]}
                  placeholder={t("settings.nicknamePlaceholder")}
                  placeholderTextColor={colors.placeholder}
                  value={nickname}
                  onChangeText={setNicknameState}
                  onBlur={handleNicknameBlur}
                  returnKeyType="done"
                  testID={TID.settings.nicknameInput}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: 宝宝管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} testID={TID.settings.sectionBabies}>{t("settings.babyManagement")}</Text>

          {babies && babies.length > 0 && (
            <View style={[styles.card, { marginBottom: spacing.sm }]}>
              {babies.map((baby, idx) => (
                <Pressable
                  key={baby.id}
                  onPress={() => setEditingBaby(editingBaby?.id === baby.id ? null : baby)}
                  testID={TID.settings.babyRow(baby.id)}
                >
                  <View style={[styles.babyRow, idx < babies.length - 1 && styles.babyRowBorder]}>
                    {baby.avatarUrl ? (
                      <Image source={{ uri: baby.avatarUrl.startsWith("/") ? `${API_BASE_URL}${baby.avatarUrl}` : baby.avatarUrl }} style={styles.babyAvatarImg} />
                    ) : (
                      <View style={styles.babyAvatar}>
                        <Text style={styles.babyAvatarText}>{baby.name.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={styles.babyInfo}>
                      <Text style={styles.babyName}>{baby.name}</Text>
                      <Text style={styles.babyDate}>{baby.birthDate}</Text>
                    </View>
                    <Pressable onPress={() => handleDeleteBaby(baby)} hitSlop={8} style={styles.deleteBtn} testID={TID.settings.deleteBabyButton(baby.id)}>
                      <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Baby detail editor */}
          {editingBaby && (
            <View style={[styles.card, { marginBottom: spacing.sm }]} testID={TID.settings.babyDetailSection}>
              <Text style={styles.cardLabel}>{t("settings.babyDetail")}</Text>
              <View style={styles.profileRow}>
                <Pressable onPress={() => handleBabyAvatarUpload(editingBaby)} testID={TID.settings.babyAvatarButton}>
                  {editingBaby.avatarUrl ? (
                    <Image source={{ uri: editingBaby.avatarUrl.startsWith("/") ? `${API_BASE_URL}${editingBaby.avatarUrl}` : editingBaby.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                      <MaterialIcons name="child-care" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changeAvatarText}>{t("settings.changeAvatar")}</Text>
                </Pressable>
                <View style={styles.nicknameCol}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, marginBottom: spacing.xs }]}
                    placeholder={t("settings.babyNamePlaceholder")}
                    placeholderTextColor={colors.placeholder}
                    value={editingBaby.name}
                    onChangeText={(v) => setEditingBaby({ ...editingBaby, name: v })}
                    onBlur={() => patchBaby.mutate({ babyId: editingBaby.id, body: { name: editingBaby.name } })}
                    testID={TID.settings.babyDetailName}
                  />
                </View>
              </View>
              <Text style={styles.rowLabel}>{t("settings.gender")}</Text>
              <View style={styles.langRow}>
                {(["male", "female", "other"] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.langChip, editingBaby.gender === g && styles.langChipSelected]}
                    onPress={() => { setEditingBaby({ ...editingBaby, gender: g }); patchBaby.mutate({ babyId: editingBaby.id, body: { gender: g } }); }}
                    testID={TID.settings.babyGenderChip(g)}
                  >
                    <Text style={[styles.langChipText, editingBaby.gender === g && styles.langChipTextSelected]}>{t(`settings.gender_${g}`)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.rowLabel, { marginTop: spacing.sm }]}>{t("settings.bloodType")}</Text>
              <View style={styles.langRow}>
                {(["A", "B", "AB", "O"] as const).map((bt) => (
                  <Pressable
                    key={bt}
                    style={[styles.langChip, editingBaby.bloodType === bt && styles.langChipSelected]}
                    onPress={() => { setEditingBaby({ ...editingBaby, bloodType: bt }); patchBaby.mutate({ babyId: editingBaby.id, body: { bloodType: bt } }); }}
                    testID={TID.settings.babyBloodTypeChip(bt)}
                  >
                    <Text style={[styles.langChipText, editingBaby.bloodType === bt && styles.langChipTextSelected]}>{bt}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[inputStyle, { marginTop: spacing.sm }]}
                placeholder={t("settings.allergies")}
                placeholderTextColor={colors.placeholder}
                value={editingBaby.allergies ?? ""}
                onChangeText={(v) => setEditingBaby({ ...editingBaby, allergies: v })}
                onBlur={() => patchBaby.mutate({ babyId: editingBaby.id, body: { allergies: editingBaby.allergies || null } })}
                testID={TID.settings.babyAllergiesInput}
              />
              <TextInput
                style={inputStyle}
                placeholder={t("settings.babyNotes")}
                placeholderTextColor={colors.placeholder}
                value={editingBaby.notes ?? ""}
                onChangeText={(v) => setEditingBaby({ ...editingBaby, notes: v })}
                onBlur={() => patchBaby.mutate({ babyId: editingBaby.id, body: { notes: editingBaby.notes || null } })}
                multiline
                testID={TID.settings.babyNotesInput}
              />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t("settings.addBaby")}</Text>
            <TextInput
              style={inputStyle} placeholder={t("settings.babyNamePlaceholder")}
              placeholderTextColor={colors.placeholder} value={newBabyName}
              onChangeText={setNewBabyName} testID={TID.settings.babyNameInput}
            />
            <DatePicker
              value={newBabyBirth} onChange={setNewBabyBirth} maximumDate={new Date()}
              placeholder={t("settings.birthPlaceholder")} testID={TID.settings.babyBirthButton}
            />
            <Pressable
              style={[styles.primaryButton, createBaby.isPending && styles.primaryButtonDisabled]}
              onPress={handleAddBaby} disabled={createBaby.isPending} testID={TID.settings.addBabyButton}
            >
              <Text style={styles.primaryButtonText}>{createBaby.isPending ? t("settings.adding") : t("settings.add")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Section 4: 账号与安全 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} testID={TID.settings.sectionAccount}>{t("settings.account")}</Text>
          <View style={styles.card}>
            <Text style={styles.tokenStatus} testID={TID.settings.tokenStatus}>
              {token ? t("settings.tokenSaved") : t("settings.notLoggedIn")}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                Alert.alert(t("settings.logoutConfirmTitle"), t("settings.logoutConfirmMsg"), [
                  { text: t("common.cancel"), style: "cancel" },
                  { text: t("settings.logoutAction"), style: "destructive", onPress: onLogout },
                ])
              }
              testID={TID.settings.logoutButton}
            >
              <Text style={styles.secondaryButtonText}>{t("settings.logout")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: "600", color: colors.text, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  cardLabel: { fontSize: 15, fontWeight: "500", color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 16, color: colors.text },
  langRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  langChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: borderRadius.button, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
  langChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  langChipText: { fontSize: 13, color: colors.text },
  langChipTextSelected: { color: "#FFFFFF", fontWeight: "500" },
  profileRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { backgroundColor: colors.backgroundSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  changeAvatarText: { fontSize: 11, color: colors.primary, textAlign: "center", marginTop: 4 },
  nicknameCol: { flex: 1, gap: spacing.xs },
  babyRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  babyRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  babyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginRight: spacing.sm },
  babyAvatarImg: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm },
  babyAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  babyInfo: { flex: 1 },
  babyName: { fontSize: 16, fontWeight: "500", color: colors.text },
  babyDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: spacing.xs },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.input, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, backgroundColor: colors.card, color: colors.text, marginBottom: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.button, alignItems: "center", marginTop: spacing.xs, ...shadow.primary },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondaryButton: { paddingVertical: 16, borderRadius: borderRadius.button, alignItems: "center", borderWidth: 1.5, borderColor: colors.primary, marginTop: spacing.sm, backgroundColor: "transparent" },
  secondaryButtonText: { fontSize: 16, color: colors.primary, fontWeight: "500" },
  tokenStatus: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs },
});
