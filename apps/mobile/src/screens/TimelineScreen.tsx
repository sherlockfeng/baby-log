import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getStoredToken } from "../store/token";
import { getProfile } from "../store/profile";
import { apiJson, apiRequest } from "../api/client";
import type { Baby, Event } from "@babylog/shared-types";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";
import { useToast } from "../components/Toast";
import { PhotoGrid } from "../components/PhotoGrid";

const EVENT_TYPE_I18N: Record<string, string> = {
  feed: "quickAdd.feed",
  poop: "quickAdd.poop",
  weight: "quickAdd.weight",
  vaccine: "quickAdd.vaccine",
  sleep: "quickAdd.sleep",
  diaper: "quickAdd.diaper",
  solid: "quickAdd.solid",
  milestone: "quickAdd.milestone",
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  feed: "#5C9B5C", poop: "#B8860B", weight: "#2196F3", vaccine: "#9C27B0",
  sleep: "#2196F3", diaper: "#FF9800", solid: "#E91E63", milestone: "#FFD700",
};

const EVENT_TYPE_ICON: Record<string, string> = {
  feed: "child-care", poop: "child-care", weight: "fitness-center",
  vaccine: "local-hospital", sleep: "nightlight-round", diaper: "child-care",
  solid: "restaurant", milestone: "emoji-events",
};

function useFormatPayload() {
  const { t } = useTranslation();
  return (eventType: string, payload: unknown): string => {
    if (!payload || typeof payload !== "object") return "";
    const p = payload as Record<string, unknown>;
    const parts: string[] = [];

    const SIDE_MAP: Record<string, string> = { left: "timeline.payloadLeft", right: "timeline.payloadRight", both: "timeline.payloadBothSides" };
    const QUALITY_MAP: Record<string, string> = { good: "timeline.payloadGood", fair: "timeline.payloadFair", poor: "timeline.payloadPoor" };
    const COLOR_MAP: Record<string, string> = { yellow: "timeline.payloadYellow", green: "timeline.payloadGreen", brown: "timeline.payloadBrown", abnormal: "timeline.payloadAbnormal" };
    const AMOUNT_MAP: Record<string, string> = { small: "timeline.payloadSmall", medium: "timeline.payloadMedium", large: "timeline.payloadLarge" };
    const REACTION_MAP: Record<string, string> = { mild: "timeline.payloadMildReaction", severe: "timeline.payloadSevereReaction" };

    switch (eventType) {
      case "feed": {
        const ml = p.amountMl ?? p.amountMI;
        if (ml != null) parts.push(`${ml} ml`);
        const method = p.method as string | undefined;
        if (method === "bottle") parts.push(t("timeline.payloadBottle"));
        else if (method === "breast") parts.push(t("timeline.payloadBreast"));
        else if (method === "mixed") parts.push(t("timeline.payloadMixed"));
        if (p.durationMin != null) parts.push(t("timeline.payloadDuration", { count: p.durationMin }));
        const sideKey = SIDE_MAP[p.side as string];
        if (sideKey) parts.push(t(sideKey));
        if (p.note) parts.push(String(p.note));
        break;
      }
      case "poop": {
        const kindLabel: Record<string, string> = { normal: "timeline.payloadGood", loose: "timeline.payloadFair", hard: "timeline.payloadPoor", watery: "timeline.payloadAbnormal" };
        const kk = kindLabel[p.kind as string];
        if (kk) parts.push(t(kk));
        const ck = COLOR_MAP[p.color as string];
        if (ck) parts.push(t(ck));
        const ak = AMOUNT_MAP[p.amount as string];
        if (ak) parts.push(t(ak));
        if (p.note) parts.push(String(p.note));
        break;
      }
      case "weight":
        if (p.kg != null) parts.push(`${p.kg} kg`);
        if (p.note) parts.push(String(p.note));
        break;
      case "vaccine":
        if (p.name) parts.push(String(p.name));
        if (p.institution) parts.push(String(p.institution));
        if (p.dose) parts.push(String(p.dose));
        if (p.note) parts.push(String(p.note));
        break;
      case "sleep": {
        const start = p.startTime ? new Date(p.startTime as string) : null;
        const end = p.endTime ? new Date(p.endTime as string) : null;
        if (start) parts.push(start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
        if (end) parts.push(end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
        if (start && end) {
          const min = Math.round((end.getTime() - start.getTime()) / 60000);
          if (min > 0) parts.push(t("timeline.minutes", { count: min }));
        }
        const qk = QUALITY_MAP[p.quality as string];
        if (qk) parts.push(t(qk));
        if (p.note) parts.push(String(p.note));
        break;
      }
      case "diaper": {
        const k = p.kind as string | undefined;
        if (k === "wet") parts.push(t("timeline.payloadWet"));
        else if (k === "dirty") parts.push(t("timeline.payloadDirty"));
        else if (k === "both") parts.push(t("timeline.payloadBoth"));
        if (p.note) parts.push(String(p.note));
        break;
      }
      case "solid": {
        if (p.food) parts.push(String(p.food));
        if (p.amount) parts.push(String(p.amount));
        const rk = REACTION_MAP[p.reaction as string];
        if (rk) parts.push(t(rk));
        if (p.note) parts.push(String(p.note));
        break;
      }
      case "milestone": {
        if (p.title) parts.push(String(p.title));
        if (p.note) parts.push(String(p.note));
        break;
      }
      default:
        return JSON.stringify(payload);
    }
    return parts.filter(Boolean).join(" · ");
  };
}

function EventCard({ item, onLongPress, formatPayload, typeLabel, recorderName }: {
  item: Event; onLongPress: () => void;
  formatPayload: (t: string, p: unknown) => string; typeLabel: string;
  recorderName: string;
}) {
  const { t } = useTranslation();
  const isMilestone = item.eventType === "milestone";
  const lineColor = EVENT_TYPE_COLOR[item.eventType] || colors.primary;
  const iconName = EVENT_TYPE_ICON[item.eventType] || "event-note";
  const timeStr = new Date(item.eventTime).toLocaleString("zh-CN", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const details = formatPayload(item.eventType, item.payload);
  const metaText = recorderName ? t("timeline.recordedBy", { name: recorderName, time: timeStr }) : timeStr;
  const photoUrls = (item.payload as Record<string, unknown>)?.photoUrls as string[] | undefined;

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={400}>
      <View style={[styles.card, isMilestone && styles.milestoneCard]} testID={TID.timeline.eventCard(item.id)}>
        <View style={[styles.cardBar, { backgroundColor: lineColor }, isMilestone && styles.milestoneBar]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <MaterialIcons name={iconName as any} size={20} color={lineColor} style={styles.cardIcon} />
              <Text style={[styles.cardTitle, isMilestone && styles.milestoneTitle]}>{isMilestone ? (item.payload as Record<string, unknown>)?.title as string || typeLabel : typeLabel}</Text>
            </View>
            <Text style={styles.timeText} testID={TID.timeline.eventMeta(item.id)}>{metaText}</Text>
          </View>
          {details ? <Text style={styles.detailsText} numberOfLines={2} testID={TID.timeline.eventDetail(item.id)}>{details}</Text> : null}
          {photoUrls && photoUrls.length > 0 && (
            <PhotoGrid photos={photoUrls} testID={TID.timeline.eventPhotos(item.id)} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getPayloadNote(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  return String((payload as Record<string, unknown>).note ?? "");
}

function setPayloadNote(payload: unknown, note: string): unknown {
  const p = (payload && typeof payload === "object" ? { ...payload as object } : {}) as Record<string, unknown>;
  p.note = note || undefined;
  return p;
}

type TimelineFilter = "all" | "daily" | "milestone";

export function TimelineScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formatPayload = useFormatPayload();
  const [babyId, setBabyId] = useState<string | undefined>();
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editNote, setEditNote] = useState("");
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: babies } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });
  const { data: list, isLoading } = useQuery({
    queryKey: ["events", token, babyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (babyId) params.set("babyId", babyId);
      params.set("limit", "50");
      return apiJson<{ events: Event[] }>(`/events?${params}`, { token: token ?? undefined });
    },
    enabled: !!token,
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest(`/events/${eventId}`, { method: "DELETE", token: token ?? undefined });
      if (!res.ok) throw new Error(t("timeline.deleteFailed"));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast(t("timeline.deleted")); },
    onError: (e: Error) => toast(e.message || t("timeline.deleteFailed"), "error"),
  });

  const patchEvent = useMutation({
    mutationFn: async ({ eventId, payload }: { eventId: string; payload: unknown }) => {
      return apiJson(`/events/${eventId}`, { method: "PATCH", token: token ?? undefined, body: { payload } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast(t("timeline.saved")); setEditingEvent(null); },
    onError: (e: Error) => toast(e.message || t("timeline.saveFailed"), "error"),
  });

  const handleLongPress = (event: Event) => {
    const label = t(EVENT_TYPE_I18N[event.eventType] || event.eventType);
    Alert.alert(label, undefined, [
      { text: t("timeline.editNote"), onPress: () => { setEditNote(getPayloadNote(event.payload)); setEditingEvent(event); } },
      { text: t("common.delete"), style: "destructive", onPress: () =>
        Alert.alert(t("timeline.deleteConfirmTitle"), t("timeline.deleteConfirmMsg"), [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.delete"), style: "destructive", onPress: () => deleteEvent.mutate(event.id) },
        ]),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    patchEvent.mutate({ eventId: editingEvent.id, payload: setPayloadNote(editingEvent.payload, editNote) });
  };

  if (!token) {
    return <SafeAreaView style={styles.safe}><Text style={styles.msg}>{t("common.pleaseLogin")}</Text></SafeAreaView>;
  }

  const allEvents = list?.events ?? [];
  const events = filter === "all" ? allEvents :
    filter === "milestone" ? allEvents.filter((e) => e.eventType === "milestone") :
    allEvents.filter((e) => e.eventType !== "milestone");

  return (
    <SafeAreaView style={styles.safe} testID={TID.timeline.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("timeline.title")}</Text>

        {babies && babies.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.label}>{t("timeline.filterBaby")}</Text>
            <View style={styles.chipRow}>
              <Pressable style={[styles.chip, babyId === undefined && styles.chipSelected]} onPress={() => setBabyId(undefined)} testID={TID.timeline.filterAll}>
                <Text style={[styles.chipText, babyId === undefined && styles.chipTextSelected]}>{t("timeline.filterAll")}</Text>
              </Pressable>
              {babies.map((b) => (
                <Pressable key={b.id} style={[styles.chip, babyId === b.id && styles.chipSelected]} onPress={() => setBabyId(b.id)} testID={TID.timeline.filterBaby(b.id)}>
                  <Text style={[styles.chipText, babyId === b.id && styles.chipTextSelected]}>{b.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.filterSection}>
          <View style={styles.chipRow}>
            {(["all", "daily", "milestone"] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, filter === f && styles.chipSelected]}
                onPress={() => setFilter(f)}
                testID={TID.timeline.filterType(f)}
              >
                <Text style={[styles.chipText, filter === f && styles.chipTextSelected]}>
                  {t(`timeline.filter_${f}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <Text style={styles.msg}>{t("common.loading")}</Text>
        ) : events.length === 0 ? (
          <View style={styles.emptyWrap} testID={TID.timeline.emptyState}>
            <MaterialIcons name="event-note" size={48} color={colors.border} />
            <Text style={styles.emptyText}>{t("timeline.empty")}</Text>
            <Text style={styles.emptySubtext}>{t("timeline.emptySub")}</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            testID={TID.timeline.eventList}
            renderItem={({ item }) => (
              <EventCard
                item={item}
                onLongPress={() => handleLongPress(item)}
                formatPayload={formatPayload}
                typeLabel={t(EVENT_TYPE_I18N[item.eventType] || item.eventType)}
                recorderName={profile?.nickname ?? ""}
              />
            )}
          />
        )}
      </View>

      <Modal visible={!!editingEvent} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditingEvent(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}} testID={TID.timeline.editModal}>
            <Text style={styles.modalTitle}>{t("timeline.editNote")}</Text>
            <TextInput
              style={styles.modalInput} value={editNote} onChangeText={setEditNote}
              placeholder={t("timeline.notePlaceholder")} placeholderTextColor={colors.placeholder}
              multiline autoFocus testID={TID.timeline.editNoteInput}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setEditingEvent(null)} testID={TID.timeline.editCancelButton}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSave, patchEvent.isPending && { opacity: 0.7 }]}
                onPress={handleSaveEdit} disabled={patchEvent.isPending} testID={TID.timeline.editSaveButton}
              >
                <Text style={styles.modalSaveText}>{patchEvent.isPending ? t("common.saving") : t("common.save")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: 22, fontWeight: "600", color: colors.text, marginBottom: spacing.lg },
  filterSection: { marginBottom: spacing.md },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: borderRadius.button, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "500" },
  listContent: { paddingBottom: spacing.xl },
  card: { flexDirection: "row", backgroundColor: colors.card, borderRadius: borderRadius.card, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadow.card },
  cardBar: { width: 4, marginRight: 0 },
  cardBody: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: { marginRight: spacing.xs },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  timeText: { fontSize: 13, color: colors.textSecondary },
  detailsText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  milestoneCard: { borderColor: "#FFD700", borderWidth: 1.5 },
  milestoneBar: { width: 6 },
  milestoneTitle: { fontSize: 17, color: "#B8860B" },
  msg: { padding: spacing.xl, textAlign: "center", fontSize: 15, color: colors.textSecondary },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: 14, color: colors.placeholder, marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", paddingHorizontal: spacing.lg },
  modalCard: { backgroundColor: colors.card, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: spacing.md },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.input, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: colors.text, backgroundColor: colors.backgroundSecondary, minHeight: 80, textAlignVertical: "top", marginBottom: spacing.md },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: borderRadius.button, borderWidth: 1.5, borderColor: colors.border },
  modalCancelText: { fontSize: 15, color: colors.textSecondary },
  modalSave: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: borderRadius.button, backgroundColor: colors.primary, ...shadow.primary },
  modalSaveText: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" },
});
