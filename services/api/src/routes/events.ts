import type { D1Database } from "@cloudflare/workers-types";
import * as db from "../db/queries";

function eventRowToJson(r: { id: string; family_id: string; baby_id: string; event_type: string; event_time: string; payload: string; created_at: string; updated_at: string }) {
  let payload: unknown = null;
  if (r.payload) {
    try {
      payload = JSON.parse(r.payload) as unknown;
    } catch {
      payload = r.payload;
    }
  }
  return {
    id: r.id,
    familyId: r.family_id,
    babyId: r.baby_id,
    eventType: r.event_type,
    eventTime: r.event_time,
    payload,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function postEvents(request: Request, familyId: string, env: { DB: D1Database }): Promise<Response> {
  let body: { id: string; babyId: string; eventType: string; eventTime: string; payload?: unknown };
  try {
    body = (await request.json()) as { id: string; babyId: string; eventType: string; eventTime: string; payload?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id || !body.babyId || !body.eventType || !body.eventTime) {
    return Response.json({ error: "id, babyId, eventType, eventTime required" }, { status: 400 });
  }
  const baby = await db.getBaby(env.DB, familyId, body.babyId);
  if (!baby) return Response.json({ error: "Baby not found" }, { status: 404 });
  const payloadStr = body.payload != null ? JSON.stringify(body.payload) : "null";
  const status = await db.createEvent(env.DB, body.id, familyId, body.babyId, body.eventType, body.eventTime, payloadStr);
  if (status === "exists") {
    const existing = await db.getEvent(env.DB, familyId, body.id);
    return Response.json(eventRowToJson(existing!));
  }
  return Response.json({
    id: body.id,
    familyId,
    babyId: body.babyId,
    eventType: body.eventType,
    eventTime: body.eventTime,
    payload: body.payload ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function getEvents(
  familyId: string,
  env: { DB: D1Database },
  url: URL
): Promise<Response> {
  const babyId = url.searchParams.get("babyId") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const typeParams = url.searchParams.getAll("type");
  const types = typeParams.length ? typeParams : undefined;
  const limit = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const { events, nextCursor } = await db.listEvents(env.DB, familyId, {
    babyId,
    from,
    to,
    types,
    limit: limit ? parseInt(limit, 10) : undefined,
    cursor,
  });
  return Response.json({
    events: events.map(eventRowToJson),
    nextCursor: nextCursor ?? undefined,
  });
}

export async function patchEvent(
  familyId: string,
  eventId: string,
  request: Request,
  env: { DB: D1Database }
): Promise<Response> {
  const existing = await db.getEvent(env.DB, familyId, eventId);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  let body: { eventTime?: string; payload?: unknown } = {};
  try {
    body = (await request.json()) as { eventTime?: string; payload?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { event_time?: string; payload?: string } = {};
  if (body.eventTime !== undefined) updates.event_time = body.eventTime;
  if (body.payload !== undefined) updates.payload = JSON.stringify(body.payload);
  if (Object.keys(updates).length > 0) {
    await db.updateEvent(env.DB, familyId, eventId, updates);
  }
  const updated = await db.getEvent(env.DB, familyId, eventId);
  return Response.json(eventRowToJson(updated!));
}

export async function deleteEvent(familyId: string, eventId: string, env: { DB: D1Database }): Promise<Response> {
  const ok = await db.deleteEvent(env.DB, familyId, eventId);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
