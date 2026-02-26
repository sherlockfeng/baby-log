// --- Domain ---

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  birthDate: string; // ISO date
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
}

export interface FeedPayload {
  amountMl?: number;
  method?: "breast" | "bottle" | "mixed";
  note?: string;
}

export interface PoopPayload {
  kind?: "normal" | "loose" | "hard" | "watery";
  color?: string;
  texture?: string;
  note?: string;
}

export interface WeightPayload {
  kg: number;
  note?: string;
}

export interface VaccinePayload {
  name: string;
  dose?: string;
  note?: string;
}

export interface SleepPayload {
  startTime: string; // ISO
  endTime: string;   // ISO
  note?: string;
}

export interface DiaperPayload {
  kind: "wet" | "dirty" | "both";
  note?: string;
}

export interface SolidPayload {
  food: string;
  amount?: string;
  reaction?: string;
  note?: string;
}

export type EventPayload =
  | FeedPayload
  | PoopPayload
  | WeightPayload
  | VaccinePayload
  | SleepPayload
  | DiaperPayload
  | SolidPayload;

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
