// --- Domain ---

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  birthDate: string; // ISO date
  gender?: "male" | "female" | "other";
  heightCm?: number;
  bloodType?: "A" | "B" | "AB" | "O" | "unknown";
  allergies?: string;
  avatarUrl?: string;
  notes?: string;
  createdAt: string; // ISO
}

export enum EventType {
  Feed = "feed",
  Poop = "poop",
  Weight = "weight",
  Vaccine = "vaccine",
  Sleep = "sleep",
  Diaper = "diaper",
  Solid = "solid",
  Milestone = "milestone",
}

export interface FeedPayload {
  amountMl?: number;
  method?: "breast" | "bottle" | "mixed";
  durationMin?: number;
  side?: "left" | "right" | "both";
  note?: string;
}

export interface PoopPayload {
  kind?: "normal" | "loose" | "hard" | "watery";
  color?: "yellow" | "green" | "brown" | "abnormal";
  amount?: "small" | "medium" | "large";
  note?: string;
}

export interface WeightPayload {
  kg: number;
  note?: string;
}

export interface VaccinePayload {
  name: string;
  dose?: string;
  institution?: string;
  nextDate?: string; // ISO date for next reminder
  note?: string;
}

export interface SleepPayload {
  startTime: string; // ISO
  endTime: string;   // ISO
  quality?: "good" | "fair" | "poor";
  note?: string;
}

export interface DiaperPayload {
  kind: "wet" | "dirty" | "both";
  note?: string;
}

export interface SolidPayload {
  food: string;
  amount?: string;
  reaction?: "none" | "mild" | "severe";
  note?: string;
}

export interface MilestonePayload {
  title: string;
  template?: string;
  photoUrls?: string[];
  note?: string;
}

export interface BasePayloadExtras {
  photoUrls?: string[];
}

export type EventPayload =
  | (FeedPayload & BasePayloadExtras)
  | (PoopPayload & BasePayloadExtras)
  | (WeightPayload & BasePayloadExtras)
  | (VaccinePayload & BasePayloadExtras)
  | (SleepPayload & BasePayloadExtras)
  | (DiaperPayload & BasePayloadExtras)
  | (SolidPayload & BasePayloadExtras)
  | MilestonePayload;

export interface Event {
  id: string;
  familyId: string;
  babyId: string;
  eventType: EventType;
  eventTime: string; // ISO
  payload: EventPayload;
  createdAt: string;
  updatedAt: string;
}

// --- API DTOs ---

export interface CreateFamilyRequest {
  name?: string;
}

export interface CreateFamilyResponse {
  familyId: string;
  token: string;
  name?: string;
}

export interface CreateBabyRequest {
  name: string;
  birthDate: string; // ISO date
}

export interface UpdateBabyRequest {
  name?: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  heightCm?: number;
  bloodType?: "A" | "B" | "AB" | "O" | "unknown";
  allergies?: string;
  avatarUrl?: string;
  notes?: string;
}

export interface CreateEventRequest {
  id: string;
  babyId: string;
  eventType: EventType;
  eventTime: string; // ISO
  payload: EventPayload;
}

export interface UpdateEventRequest {
  eventTime?: string;
  payload?: EventPayload;
}

export interface ListEventsQuery {
  babyId?: string;
  from?: string; // ISO
  to?: string;   // ISO
  type?: EventType | EventType[];
  limit?: number;
  cursor?: string;
}

export interface ListEventsResponse {
  events: Event[];
  nextCursor?: string;
}

export interface StatsFeedsQuery {
  babyId: string;
  days?: number;
}

export interface StatsWeightQuery {
  babyId: string;
  days?: number;
}

export interface StatsSleepQuery {
  babyId: string;
  days?: number;
}
