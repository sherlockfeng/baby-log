import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getStoredToken } from "../store/token";
import { apiJson } from "../api/client";
import type { Baby } from "@babylog/shared-types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { API_BASE_URL } from "../config";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";

export type RootStackParamList = {
  Home: undefined;
  QuickAdd: undefined;
  Timeline: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface TodayStats {
  feedCount: number;
  feedTotalMl: number;
  sleepTotalMin: number;
  lastFeedTime: string | null;
  lastDiaperTime: string | null;
}

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("timeAgo.justNow");
    if (mins < 60) return t("timeAgo.minutesAgo", { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("timeAgo.hoursAgo", { count: hrs });
    const days = Math.floor(hrs / 24);
    return t("timeAgo.daysAgo", { count: days });
  };
}

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: babies, isLoading } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });

  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  useEffect(() => {
    if (babies?.length && !selectedBabyId) setSelectedBabyId(babies[0].id);
  }, [babies, selectedBabyId]);

  const { data: stats } = useQuery({
    queryKey: ["stats", "today", token, selectedBabyId],
    queryFn: () => apiJson<TodayStats>(`/stats/today?babyId=${selectedBabyId}`, { token: token ?? undefined }),
    enabled: !!token && !!selectedBabyId,
    refetchInterval: 60000,
  });

  if (!token) {
    return <SafeAreaView style={styles.safe}><Text style={styles.msg}>{t("common.pleaseLogin")}</Text></SafeAreaView>;
  }
  if (isLoading) {
    return <SafeAreaView style={styles.safe}><Text style={styles.msg}>{t("common.loading")}</Text></SafeAreaView>;
  }

  const sleepHours = stats ? Math.floor(stats.sleepTotalMin / 60) : 0;
  const sleepMinutes = stats ? stats.sleepTotalMin % 60 : 0;

  const menuItems = [
    { key: "QuickAdd", testID: TID.home.quickAddCard, icon: "add-circle-outline" as const, title: t("home.quickAdd"), subtitle: t("home.quickAddSub"), onPress: () => navigation.navigate("QuickAdd") },
    { key: "Timeline", testID: TID.home.timelineCard, icon: "timeline" as const, title: t("home.timeline"), subtitle: t("home.timelineSub"), onPress: () => navigation.navigate("Timeline") },
    { key: "Settings", testID: TID.home.settingsCard, icon: "settings" as const, title: t("home.settings"), subtitle: t("home.settingsSub"), onPress: () => navigation.navigate("Settings") },
  ];

  return (
    <SafeAreaView style={styles.safe} testID={TID.home.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} testID={TID.home.title}>{t("home.today")}</Text>

        {/* Baby selector */}
        {babies && babies.length > 0 ? (
          <View style={styles.babySection} testID={TID.home.babyInfo}>
            {babies.map((b) => (
              <Pressable key={b.id} onPress={() => setSelectedBabyId(b.id)} testID={TID.home.babyChip(b.id)}>
                <View style={[styles.babyChip, selectedBabyId === b.id && styles.babyChipSelected]}>
                  {b.avatarUrl ? (
                    <Image source={{ uri: b.avatarUrl.startsWith("/") ? `${API_BASE_URL}${b.avatarUrl}` : b.avatarUrl }} style={styles.babyAvatarImg} />
                  ) : (
                    <View style={[styles.babyAvatar, selectedBabyId === b.id && styles.babyAvatarSelected]}>
                      <Text style={styles.babyAvatarText}>{b.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={[styles.babyChipName, selectedBabyId === b.id && styles.babyChipNameSelected]}>{b.name}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.subtitle} testID={TID.home.babyInfo}>{t("home.noBabies")}</Text>
        )}

        {/* Stats dashboard */}
        {stats && selectedBabyId && (
          <View style={styles.statsGrid} testID={TID.home.dashboardSection}>
            <View style={styles.statCard} testID={TID.home.statFeed}>
              <MaterialIcons name="child-care" size={24} color="#5C9B5C" />
              <Text style={styles.statValue}>{stats.feedCount}</Text>
              <Text style={styles.statLabel}>{t("home.feedCount", { count: stats.feedCount })}</Text>
              {stats.feedTotalMl > 0 && <Text style={styles.statSub}>{t("home.feedTotal", { ml: stats.feedTotalMl })}</Text>}
            </View>
            <View style={styles.statCard} testID={TID.home.statSleep}>
              <MaterialIcons name="nightlight-round" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{sleepHours}h{sleepMinutes}m</Text>
              <Text style={styles.statLabel}>{t("home.sleepTotal", { hours: sleepHours, minutes: sleepMinutes })}</Text>
            </View>
            <View style={styles.statCard} testID={TID.home.statLastFeed}>
              <MaterialIcons name="schedule" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{stats.lastFeedTime ? timeAgo(stats.lastFeedTime) : "—"}</Text>
              <Text style={styles.statLabel}>{t("home.lastFeed")}</Text>
            </View>
            <View style={styles.statCard} testID={TID.home.statLastDiaper}>
              <MaterialIcons name="schedule" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>{stats.lastDiaperTime ? timeAgo(stats.lastDiaperTime) : "—"}</Text>
              <Text style={styles.statLabel}>{t("home.lastDiaper")}</Text>
            </View>
          </View>
        )}

        {!stats && selectedBabyId && (
          <Text style={styles.noDataText} testID={TID.home.lastRecord}>{t("home.noData")}</Text>
        )}

        {/* Quick entry cards */}
        <View style={styles.cards}>
          {menuItems.map((item) => (
            <Pressable key={item.key} style={styles.card} onPress={item.onPress} testID={item.testID}>
              <View style={styles.cardIconWrap}>
                <MaterialIcons name={item.icon} size={28} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  babySection: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  babyChip: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
    borderRadius: borderRadius.button, paddingVertical: 6, paddingHorizontal: 12, paddingRight: 16,
    borderWidth: 1.5, borderColor: colors.border, gap: 8,
  },
  babyChipSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary },
  babyAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, justifyContent: "center", alignItems: "center" },
  babyAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  babyAvatarSelected: { backgroundColor: colors.primary },
  babyAvatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  babyChipName: { fontSize: 14, color: colors.text, fontWeight: "500" },
  babyChipNameSelected: { color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    width: "47%", backgroundColor: colors.card, borderRadius: borderRadius.card,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", gap: 4, ...shadow.card,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary, textAlign: "center" },
  statSub: { fontSize: 11, color: colors.placeholder },
  noDataText: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: "center" },
  cards: { gap: spacing.sm },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
    borderRadius: borderRadius.card, padding: spacing.md, borderWidth: 1,
    borderColor: colors.border, ...shadow.card,
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.backgroundSecondary,
    justifyContent: "center", alignItems: "center", marginRight: spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  msg: { flex: 1, textAlign: "center", marginTop: 48, fontSize: 15, color: colors.textSecondary },
});
