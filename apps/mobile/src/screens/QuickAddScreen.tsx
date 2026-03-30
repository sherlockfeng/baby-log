import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { getStoredToken } from "../store/token";
import { apiJson, apiUpload } from "../api/client";
import type { Baby, EventType } from "@babylog/shared-types";
import { colors, spacing, borderRadius, shadow } from "../theme";
import { TID } from "../testids";
import { useToast } from "../components/Toast";
import { DatePicker } from "../components/DatePicker";
import { useTimer } from "../components/TimerContext";
import { PhotoPicker } from "../components/PhotoPicker";

const EVENT_TYPE_KEYS: { type: EventType; i18nKey: string }[] = [
  { type: "feed" as EventType, i18nKey: "quickAdd.feed" },
  { type: "sleep" as EventType, i18nKey: "quickAdd.sleep" },
  { type: "diaper" as EventType, i18nKey: "quickAdd.diaper" },
  { type: "poop" as EventType, i18nKey: "quickAdd.poop" },
  { type: "solid" as EventType, i18nKey: "quickAdd.solid" },
  { type: "weight" as EventType, i18nKey: "quickAdd.weight" },
  { type: "vaccine" as EventType, i18nKey: "quickAdd.vaccine" },
  { type: "milestone" as EventType, i18nKey: "quickAdd.milestone" },
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const MILESTONE_TEMPLATES = [
  { key: "rollOver" },
  { key: "sit" },
  { key: "crawl" },
  { key: "stand" },
  { key: "walk" },
  { key: "callMama" },
  { key: "callDada" },
  { key: "firstTooth" },
  { key: "firstWord" },
  { key: "custom" },
];

function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress} testID={testID}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function QuickAddScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: token } = useQuery({ queryKey: ["token"], queryFn: getStoredToken });
  const { data: babies } = useQuery({
    queryKey: ["babies", token],
    queryFn: () => apiJson<Baby[]>("/babies", { token: token ?? undefined }),
    enabled: !!token,
  });
  const navigation = useNavigation<any>();
  const { timer, startTimer, stopTimer } = useTimer();
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [babyId, setBabyId] = useState("");

  useEffect(() => {
    if (babies?.length === 1 && !babyId) setBabyId(babies[0].id);
  }, [babies, babyId]);

  // Feed
  const [amountMl, setAmountMl] = useState("");
  const [method, setMethod] = useState<"breast" | "bottle" | "mixed">("bottle");
  const [durationMin, setDurationMin] = useState("");
  const [side, setSide] = useState<"left" | "right" | "both">("both");
  // Poop
  const [poopKind, setPoopKind] = useState<"normal" | "loose" | "hard" | "watery">("normal");
  const [poopColor, setPoopColor] = useState<"yellow" | "green" | "brown" | "abnormal">("yellow");
  const [poopAmount, setPoopAmount] = useState<"small" | "medium" | "large">("medium");
  // Sleep
  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");
  const [sleepQuality, setSleepQuality] = useState<"good" | "fair" | "poor">("good");
  // Vaccine
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineInstitution, setVaccineInstitution] = useState("");
  const [vaccineNextDate, setVaccineNextDate] = useState("");
  // Weight
  const [kg, setKg] = useState("");
  // Solid
  const [food, setFood] = useState("");
  const [solidAmount, setSolidAmount] = useState("");
  const [solidReaction, setSolidReaction] = useState<"none" | "mild" | "severe">("none");
  // Diaper
  const [diaperKind, setDiaperKind] = useState<"wet" | "dirty" | "both">("wet");
  // Milestone
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneTemplate, setMilestoneTemplate] = useState("");
  // Photos (shared across all types)
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  // Common
  const [note, setNote] = useState("");

  const resetForm = () => {
    setSelectedType(null);
    setAmountMl(""); setDurationMin(""); setSide("both"); setMethod("bottle");
    setPoopKind("normal"); setPoopColor("yellow"); setPoopAmount("medium");
    setSleepStart(""); setSleepEnd(""); setSleepQuality("good");
    setVaccineName(""); setVaccineInstitution(""); setVaccineNextDate("");
    setKg(""); setFood(""); setSolidAmount(""); setSolidReaction("none");
    setDiaperKind("wet"); setMilestoneTitle(""); setMilestoneTemplate("");
    setPhotos([]); setNote("");
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    const files = photos.map((a) => ({
      uri: a.uri,
      name: a.fileName || `photo.${(a.mimeType || "image/jpeg").split("/")[1]}`,
      type: a.mimeType || "image/jpeg",
    }));
    const result = await apiUpload("/upload", files, token);
    return result.files.map((f) => f.url);
  };

  const handleStartTimer = (type: "feed" | "sleep") => {
    startTimer(type);
    toast(t("quickAdd.timerRunning"));
  };

  const handleStopAndFill = () => {
    const result = stopTimer();
    if (!result) return;
    if (result.type === "feed") {
      setSelectedType("feed" as EventType);
      setDurationMin(String(result.durationMin));
    } else if (result.type === "sleep") {
      setSelectedType("sleep" as EventType);
      setSleepStart(result.startIso);
      setSleepEnd(result.endIso);
    }
  };

  const createEvent = useMutation({
    mutationFn: async (body: unknown) => {
      const photoUrls = await uploadPhotos();
      const b = body as Record<string, unknown>;
      if (photoUrls.length > 0) {
        b.payload = { ...(b.payload as Record<string, unknown>), photoUrls };
      }
      return apiJson("/events", { method: "POST", token: token ?? undefined, body: b });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      resetForm();
      toast(t("quickAdd.recordSuccess"));
    },
    onError: (e: Error) => toast(e.message || t("quickAdd.recordFailed"), "error"),
  });

  const submitFeed = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "feed", eventTime: new Date().toISOString(),
      payload: {
        amountMl: amountMl ? parseInt(amountMl, 10) : undefined,
        method,
        durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
        side: method === "breast" || method === "mixed" ? side : undefined,
        note: note || undefined,
      },
    });
  };

  const submitPoop = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "poop", eventTime: new Date().toISOString(),
      payload: { kind: poopKind, color: poopColor, amount: poopAmount, note: note || undefined },
    });
  };

  const submitWeight = () => {
    if (!babyId || !token || !kg) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "weight", eventTime: new Date().toISOString(),
      payload: { kg: parseFloat(kg), note: note || undefined },
    });
  };

  const submitVaccine = () => {
    if (!babyId || !token || !vaccineName) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "vaccine", eventTime: new Date().toISOString(),
      payload: {
        name: vaccineName,
        institution: vaccineInstitution || undefined,
        nextDate: vaccineNextDate || undefined,
        note: note || undefined,
      },
    });
  };

  const submitSleep = () => {
    if (!babyId || !token || !sleepStart || !sleepEnd) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "sleep", eventTime: new Date().toISOString(),
      payload: { startTime: sleepStart, endTime: sleepEnd, quality: sleepQuality, note: note || undefined },
    });
  };

  const submitDiaper = () => {
    if (!babyId || !token) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "diaper", eventTime: new Date().toISOString(),
      payload: { kind: diaperKind, note: note || undefined },
    });
  };

  const submitSolid = () => {
    if (!babyId || !token || !food) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "solid", eventTime: new Date().toISOString(),
      payload: { food, amount: solidAmount || undefined, reaction: solidReaction !== "none" ? solidReaction : undefined, note: note || undefined },
    });
  };

  const submitMilestone = () => {
    if (!babyId || !token || !milestoneTitle) return;
    createEvent.mutate({
      id: uuid(), babyId, eventType: "milestone", eventTime: new Date().toISOString(),
      payload: {
        title: milestoneTitle,
        template: milestoneTemplate || undefined,
        note: note || undefined,
      },
    });
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text }];
  const inputProps = { placeholderTextColor: colors.placeholder, style: inputStyle, editable: !createEvent.isPending };
  const pending = createEvent.isPending;

  if (!token) {
    return <SafeAreaView style={styles.safe}><Text style={styles.msg}>{t("common.pleaseLogin")}</Text></SafeAreaView>;
  }

  if (!babies?.length) {
    return (
      <SafeAreaView style={styles.safe} testID={TID.quickAdd.screen}>
        <View style={styles.emptyWrap} testID={TID.quickAdd.emptyState}>
          <MaterialIcons name="child-care" size={48} color={colors.border} />
          <Text style={styles.emptyText} testID={TID.quickAdd.emptyMessage}>{t("quickAdd.noBabies")}</Text>
          <Pressable style={styles.emptyButton} onPress={() => navigation.navigate("Settings")} testID={TID.quickAdd.goAddBabyButton}>
            <Text style={styles.emptyButtonText}>{t("quickAdd.goAddBaby")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID={TID.quickAdd.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("quickAdd.title")}</Text>

        <Text style={styles.label}>{t("quickAdd.selectBaby")}</Text>
        <View style={styles.chipRow}>
          {babies.map((b) => (
            <Chip key={b.id} label={b.name} selected={babyId === b.id} onPress={() => setBabyId(b.id)} testID={TID.quickAdd.babyChip(b.id)} />
          ))}
        </View>

        <Text style={styles.label}>{t("quickAdd.eventType")}</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPE_KEYS.map(({ type, i18nKey }) => (
            <Chip key={type} label={t(i18nKey)} selected={selectedType === type} onPress={() => setSelectedType(type)} testID={TID.quickAdd.typeChip(type)} />
          ))}
        </View>

        {/* Feed form */}
        {selectedType === "feed" && (
          <View style={styles.form}>
            <TextInput {...inputProps} placeholder={t("quickAdd.amountMl")} value={amountMl} onChangeText={setAmountMl} keyboardType="number-pad" testID={TID.quickAdd.amountInput} />
            <Text style={styles.label}>{t("quickAdd.method")}</Text>
            <View style={styles.chipRow}>
              {(["bottle", "breast", "mixed"] as const).map((m) => (
                <Chip key={m} label={t(`quickAdd.method${m.charAt(0).toUpperCase()}${m.slice(1)}` as any)} selected={method === m} onPress={() => setMethod(m)} testID={TID.quickAdd.methodChip(m)} />
              ))}
            </View>
            <View style={styles.timerRow}>
              <TextInput {...inputProps} placeholder={t("quickAdd.durationMin")} value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" testID={TID.quickAdd.durationInput} style={[inputStyle, { flex: 1, marginBottom: 0 }]} />
              {timer.active && timer.type === "feed" ? (
                <Pressable style={styles.timerBtn} onPress={handleStopAndFill} testID={TID.quickAdd.timerButton}>
                  <MaterialIcons name="stop-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.timerBtnText}>{t("quickAdd.stopTimer")}</Text>
                </Pressable>
              ) : !timer.active ? (
                <Pressable style={styles.timerBtn} onPress={() => handleStartTimer("feed")} testID={TID.quickAdd.timerButton}>
                  <MaterialIcons name="timer" size={20} color="#FFFFFF" />
                  <Text style={styles.timerBtnText}>{t("quickAdd.startTimer")}</Text>
                </Pressable>
              ) : null}
            </View>
            {(method === "breast" || method === "mixed") && (
              <>
                <Text style={styles.label}>{t("quickAdd.side")}</Text>
                <View style={styles.chipRow}>
                  {(["left", "right", "both"] as const).map((s) => (
                    <Chip key={s} label={t(`quickAdd.side${s.charAt(0).toUpperCase()}${s.slice(1)}` as any)} selected={side === s} onPress={() => setSide(s)} testID={TID.quickAdd.sideChip(s)} />
                  ))}
                </View>
              </>
            )}
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitFeed} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Sleep form */}
        {selectedType === "sleep" && (
          <View style={styles.form}>
            {timer.active && timer.type === "sleep" ? (
              <Pressable style={[styles.timerBtn, { marginBottom: spacing.sm, alignSelf: "flex-start" }]} onPress={handleStopAndFill} testID={TID.quickAdd.timerButton}>
                <MaterialIcons name="stop-circle" size={20} color="#FFFFFF" />
                <Text style={styles.timerBtnText}>{t("quickAdd.stopTimer")}</Text>
              </Pressable>
            ) : !timer.active ? (
              <Pressable style={[styles.timerBtn, { marginBottom: spacing.sm, alignSelf: "flex-start" }]} onPress={() => handleStartTimer("sleep")} testID={TID.quickAdd.timerButton}>
                <MaterialIcons name="timer" size={20} color="#FFFFFF" />
                <Text style={styles.timerBtnText}>{t("quickAdd.startTimer")}</Text>
              </Pressable>
            ) : null}
            <DatePicker value={sleepStart} onChange={setSleepStart} placeholder={t("quickAdd.sleepStart")} testID={TID.quickAdd.sleepStartInput} mode="datetime" />
            <DatePicker value={sleepEnd} onChange={setSleepEnd} placeholder={t("quickAdd.sleepEnd")} testID={TID.quickAdd.sleepEndInput} mode="datetime" />
            <Text style={styles.label}>{t("quickAdd.sleepQuality")}</Text>
            <View style={styles.chipRow}>
              {(["good", "fair", "poor"] as const).map((q) => (
                <Chip key={q} label={t(`quickAdd.quality${q.charAt(0).toUpperCase()}${q.slice(1)}` as any)} selected={sleepQuality === q} onPress={() => setSleepQuality(q)} testID={TID.quickAdd.sleepQualityChip(q)} />
              ))}
            </View>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitSleep} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Diaper form */}
        {selectedType === "diaper" && (
          <View style={styles.form}>
            <Text style={styles.label}>{t("quickAdd.diaperType")}</Text>
            <View style={styles.chipRow}>
              {(["wet", "dirty", "both"] as const).map((k) => (
                <Chip key={k} label={t(`quickAdd.diaper${k.charAt(0).toUpperCase()}${k.slice(1)}` as any)} selected={diaperKind === k} onPress={() => setDiaperKind(k)} testID={TID.quickAdd.diaperChip(k)} />
              ))}
            </View>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitDiaper} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Poop form */}
        {selectedType === "poop" && (
          <View style={styles.form}>
            <Text style={styles.label}>{t("quickAdd.poopKind")}</Text>
            <View style={styles.chipRow}>
              {(["normal", "loose", "hard", "watery"] as const).map((k) => (
                <Chip key={k} label={t(`quickAdd.poop${k.charAt(0).toUpperCase()}${k.slice(1)}` as any)} selected={poopKind === k} onPress={() => setPoopKind(k)} testID={TID.quickAdd.poopKindChip(k)} />
              ))}
            </View>
            <Text style={styles.label}>{t("quickAdd.poopColor")}</Text>
            <View style={styles.chipRow}>
              {(["yellow", "green", "brown", "abnormal"] as const).map((c) => (
                <Chip key={c} label={t(`quickAdd.color${c.charAt(0).toUpperCase()}${c.slice(1)}` as any)} selected={poopColor === c} onPress={() => setPoopColor(c)} testID={TID.quickAdd.poopColorChip(c)} />
              ))}
            </View>
            <Text style={styles.label}>{t("quickAdd.poopAmount")}</Text>
            <View style={styles.chipRow}>
              {(["small", "medium", "large"] as const).map((a) => (
                <Chip key={a} label={t(`quickAdd.amount${a.charAt(0).toUpperCase()}${a.slice(1)}` as any)} selected={poopAmount === a} onPress={() => setPoopAmount(a)} testID={TID.quickAdd.poopAmountChip(a)} />
              ))}
            </View>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitPoop} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Solid form */}
        {selectedType === "solid" && (
          <View style={styles.form}>
            <TextInput {...inputProps} placeholder={t("quickAdd.food")} value={food} onChangeText={setFood} testID={TID.quickAdd.foodInput} />
            <TextInput {...inputProps} placeholder={t("quickAdd.solidAmount")} value={solidAmount} onChangeText={setSolidAmount} testID={TID.quickAdd.solidAmountInput} />
            <Text style={styles.label}>{t("quickAdd.solidReaction")}</Text>
            <View style={styles.chipRow}>
              {(["none", "mild", "severe"] as const).map((r) => (
                <Chip key={r} label={t(`quickAdd.reaction${r.charAt(0).toUpperCase()}${r.slice(1)}` as any)} selected={solidReaction === r} onPress={() => setSolidReaction(r)} testID={TID.quickAdd.solidReactionChip(r)} />
              ))}
            </View>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitSolid} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Weight form */}
        {selectedType === "weight" && (
          <View style={styles.form}>
            <TextInput {...inputProps} placeholder={t("quickAdd.weightKg")} value={kg} onChangeText={setKg} keyboardType="decimal-pad" testID={TID.quickAdd.kgInput} />
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitWeight} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Vaccine form */}
        {selectedType === "vaccine" && (
          <View style={styles.form}>
            <TextInput {...inputProps} placeholder={t("quickAdd.vaccineName")} value={vaccineName} onChangeText={setVaccineName} testID={TID.quickAdd.vaccineNameInput} />
            <TextInput {...inputProps} placeholder={t("quickAdd.vaccineInstitution")} value={vaccineInstitution} onChangeText={setVaccineInstitution} testID={TID.quickAdd.vaccineInstitutionInput} />
            <DatePicker value={vaccineNextDate} onChange={setVaccineNextDate} placeholder={t("quickAdd.vaccineNextDate")} testID={TID.quickAdd.vaccineNextDateInput} />
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitVaccine} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}

        {/* Milestone form */}
        {selectedType === "milestone" && (
          <View style={styles.form}>
            <Text style={styles.label}>{t("quickAdd.milestoneTemplate")}</Text>
            <View style={styles.chipRow}>
              {MILESTONE_TEMPLATES.map((tpl) => (
                <Chip
                  key={tpl.key}
                  label={t(`quickAdd.tpl_${tpl.key}` as any)}
                  selected={milestoneTemplate === tpl.key}
                  onPress={() => {
                    setMilestoneTemplate(tpl.key);
                    if (!milestoneTitle) setMilestoneTitle(t(`quickAdd.tpl_${tpl.key}` as any));
                  }}
                  testID={TID.quickAdd.milestoneTemplateChip(tpl.key)}
                />
              ))}
            </View>
            <TextInput {...inputProps} placeholder={t("quickAdd.milestoneTitle")} value={milestoneTitle} onChangeText={setMilestoneTitle} testID={TID.quickAdd.milestoneTitleInput} />
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <TextInput {...inputProps} placeholder={t("quickAdd.note")} value={note} onChangeText={setNote} testID={TID.quickAdd.noteInput} />
            <Pressable style={[styles.primaryButton, pending && styles.primaryButtonDisabled]} onPress={submitMilestone} disabled={pending} testID={TID.quickAdd.submitButton}>
              <Text style={styles.primaryButtonText}>{t("quickAdd.addRecord")}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: "600", color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: borderRadius.button, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: "#FFFFFF", fontWeight: "500" },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.input, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, backgroundColor: colors.card, color: colors.text, marginBottom: spacing.sm },
  form: { marginTop: spacing.sm },
  timerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  timerBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#5C9B5C", paddingVertical: 10, paddingHorizontal: 14, borderRadius: borderRadius.button },
  timerBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.button, alignItems: "center", marginTop: spacing.md, ...shadow.primary },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  msg: { padding: spacing.lg, textAlign: "center", fontSize: 15, color: colors.textSecondary },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.lg },
  emptyButton: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: borderRadius.button, ...shadow.primary },
  emptyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
