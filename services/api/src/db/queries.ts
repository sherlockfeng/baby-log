import type { D1Database } from "@cloudflare/workers-types";

export async function getFamilyByTokenHash(db: D1Database, tokenHash: string): Promise<{ id: string } | null> {
  const row = await db.prepare("SELECT id FROM families WHERE token_hash = ?").bind(tokenHash).first<{ id: string }>();
  return row ? { id: row.id } : null;
}

export async function createFamily(db: D1Database, id: string, name: string | null, tokenHash: string): Promise<void> {
  await db.prepare("INSERT INTO families (id, name, token_hash) VALUES (?, ?, ?)")
    .bind(id, name ?? null, tokenHash)
    .run();
}

export async function getBabies(db: D1Database, familyId: string): Promise<Array<{ id: string; family_id: string; name: string; birth_date: string; created_at: string }>> {
  const { results } = await db.prepare("SELECT id, family_id, name, birth_date, created_at FROM babies WHERE family_id = ? ORDER BY created_at DESC")
    .bind(familyId)
    .all<{ id: string; family_id: string; name: string; birth_date: string; created_at: string }>();
  return results ?? [];
}

export async function getBaby(db: D1Database, familyId: string, babyId: string) {
  return db.prepare("SELECT id, family_id, name, birth_date, created_at FROM babies WHERE family_id = ? AND id = ?")
    .bind(familyId, babyId)
    .first<{ id: string; family_id: string; name: string; birth_date: string; created_at: string }>();
}

export async function createBaby(db: D1Database, id: string, familyId: string, name: string, birthDate: string): Promise<void> {
  await db.prepare("INSERT INTO babies (id, family_id, name, birth_date) VALUES (?, ?, ?, ?)")
    .bind(id, familyId, name, birthDate)
    .run();
}

export async function updateBaby(db: D1Database, familyId: string, babyId: string, updates: { name?: string; birth_date?: string }): Promise<boolean> {
  if (updates.name !== undefined) {
    await db.prepare("UPDATE babies SET name = ? WHERE family_id = ? AND id = ?").bind(updates.name, familyId, babyId).run();
  }
  if (updates.birth_date !== undefined) {
    await db.prepare("UPDATE babies SET birth_date = ? WHERE family_id = ? AND id = ?").bind(updates.birth_date, familyId, babyId).run();
  }
  const row = await db.prepare("SELECT 1 FROM babies WHERE family_id = ? AND id = ?").bind(familyId, babyId).first();
  return row != null;
}

export async function deleteBaby(db: D1Database, familyId: string, babyId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM babies WHERE family_id = ? AND id = ?").bind(familyId, babyId).run();
  return (r.meta.changes ?? 0) > 0;
}

export async function getEvent(db: D1Database, familyId: string, eventId: string) {
  return db.prepare(
    "SELECT id, family_id, baby_id, event_type, event_time, payload, created_at, updated_at FROM events WHERE family_id = ? AND id = ?"
  )
    .bind(familyId, eventId)
    .first<{ id: string; family_id: string; baby_id: string; event_type: string; event_time: string; payload: string; created_at: string; updated_at: string }>();
}

export async function listEvents(
  db: D1Database,
  familyId: string,
  opts: { babyId?: string; from?: string; to?: string; types?: string[]; limit?: number; cursor?: string }
): Promise<{ events: Array<{ id: string; family_id: string; baby_id: string; event_type: string; event_time: string; payload: string; created_at: string; updated_at: string }>; nextCursor?: string }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  let sql = "SELECT id, family_id, baby_id, event_type, event_time, payload, created_at, updated_at FROM events WHERE family_id = ?";
  const bindings: (string | number)[] = [familyId];
  if (opts.babyId) {
    sql += " AND baby_id = ?";
    bindings.push(opts.babyId);
  }
  if (opts.from) {
    sql += " AND event_time >= ?";
    bindings.push(opts.from);
  }
  if (opts.to) {
    sql += " AND event_time <= ?";
    bindings.push(opts.to);
  }
  if (opts.types?.length) {
    sql += " AND event_type IN (" + opts.types.map(() => "?").join(",") + ")";
    bindings.push(...opts.types);
  }
  sql += " ORDER BY event_time DESC LIMIT ?";
  bindings.push(limit + 1);
  const { results } = await db.prepare(sql).bind(...bindings).all();
  const rows = (results ?? []) as Array<{ id: string; family_id: string; baby_id: string; event_type: string; event_time: string; payload: string; created_at: string; updated_at: string }>;
  const hasMore = rows.length > limit;
  const events = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && events.length ? events[events.length - 1].id : undefined;
  return { events, nextCursor };
}

export async function createEvent(
  db: D1Database,
  id: string,
  familyId: string,
  babyId: string,
  eventType: string,
  eventTime: string,
  payload: string
): Promise<"created" | "exists"> {
  const existing = await getEvent(db, familyId, id);
  if (existing) return "exists";
  await db.prepare(
    "INSERT INTO events (id, family_id, baby_id, event_type, event_time, payload) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, familyId, babyId, eventType, eventTime, payload)
    .run();
  return "created";
}

export async function updateEvent(
  db: D1Database,
  familyId: string,
  eventId: string,
  updates: { event_time?: string; payload?: string }
): Promise<boolean> {
  if (updates.event_time !== undefined) {
    await db.prepare("UPDATE events SET event_time = ?, updated_at = datetime('now') WHERE family_id = ? AND id = ?")
      .bind(updates.event_time, familyId, eventId)
      .run();
  }
  if (updates.payload !== undefined) {
    await db.prepare("UPDATE events SET payload = ?, updated_at = datetime('now') WHERE family_id = ? AND id = ?")
      .bind(updates.payload, familyId, eventId)
      .run();
  }
  const row = await db.prepare("SELECT 1 FROM events WHERE family_id = ? AND id = ?").bind(familyId, eventId).first();
  return row != null;
}

export async function deleteEvent(db: D1Database, familyId: string, eventId: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM events WHERE family_id = ? AND id = ?").bind(familyId, eventId).run();
  return (r.meta.changes ?? 0) > 0;
}
