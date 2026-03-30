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

export interface BabyRow {
  id: string; family_id: string; name: string; birth_date: string;
  gender: string | null; height_cm: number | null; blood_type: string | null;
  allergies: string | null; avatar_url: string | null; notes: string | null;
  created_at: string;
}

const BABY_COLS = "id, family_id, name, birth_date, gender, height_cm, blood_type, allergies, avatar_url, notes, created_at";

export async function getBabies(db: D1Database, familyId: string): Promise<BabyRow[]> {
  const { results } = await db.prepare(`SELECT ${BABY_COLS} FROM babies WHERE family_id = ? ORDER BY created_at DESC`)
    .bind(familyId)
    .all<BabyRow>();
  return results ?? [];
}

export async function getBaby(db: D1Database, familyId: string, babyId: string) {
  return db.prepare(`SELECT ${BABY_COLS} FROM babies WHERE family_id = ? AND id = ?`)
    .bind(familyId, babyId)
    .first<BabyRow>();
}

export async function createBaby(db: D1Database, id: string, familyId: string, name: string, birthDate: string): Promise<void> {
  await db.prepare("INSERT INTO babies (id, family_id, name, birth_date) VALUES (?, ?, ?, ?)")
    .bind(id, familyId, name, birthDate)
    .run();
}

export async function updateBaby(
  db: D1Database,
  familyId: string,
  babyId: string,
  updates: Record<string, string | number | null | undefined>,
): Promise<boolean> {
  const setClauses: string[] = [];
  const bindings: (string | number | null)[] = [];
  for (const [col, val] of Object.entries(updates)) {
    if (val !== undefined) {
      setClauses.push(`${col} = ?`);
      bindings.push(val as string | number | null);
    }
  }
  if (setClauses.length > 0) {
    bindings.push(familyId, babyId);
    await db.prepare(`UPDATE babies SET ${setClauses.join(", ")} WHERE family_id = ? AND id = ?`)
      .bind(...bindings)
      .run();
  }
  const row = await db.prepare("SELECT 1 FROM babies WHERE family_id = ? AND id = ?").bind(familyId, babyId).first();
  return row != null;
}

export async function deleteBaby(db: D1Database, familyId: string, babyId: string): Promise<boolean> {
  await db.prepare("DELETE FROM events WHERE family_id = ? AND baby_id = ?").bind(familyId, babyId).run();
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
  if (opts.cursor) {
    const cursorRow = await db
      .prepare("SELECT event_time FROM events WHERE family_id = ? AND id = ?")
      .bind(familyId, opts.cursor)
      .first<{ event_time: string }>();
    if (cursorRow) {
      sql += " AND (event_time < ? OR (event_time = ? AND id < ?))";
      bindings.push(cursorRow.event_time, cursorRow.event_time, opts.cursor);
    }
  }
  sql += " ORDER BY event_time DESC, id DESC LIMIT ?";
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
