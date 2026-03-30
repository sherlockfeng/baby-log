import type { D1Database } from "@cloudflare/workers-types";
import * as db from "../db/queries";

function mapBabyRow(r: db.BabyRow) {
  return {
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    birthDate: r.birth_date,
    gender: r.gender ?? undefined,
    heightCm: r.height_cm ?? undefined,
    bloodType: r.blood_type ?? undefined,
    allergies: r.allergies ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

export async function getBabies(familyId: string, env: { DB: D1Database }): Promise<Response> {
  const rows = await db.getBabies(env.DB, familyId);
  return Response.json(rows.map(mapBabyRow));
}

export async function postBabies(request: Request, familyId: string, env: { DB: D1Database }): Promise<Response> {
  let body: { name: string; birthDate: string };
  try {
    body = (await request.json()) as { name: string; birthDate: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string") {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  if (!body.birthDate || typeof body.birthDate !== "string") {
    return Response.json({ error: "birthDate required" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await db.createBaby(env.DB, id, familyId, body.name, body.birthDate);
  return Response.json({
    id,
    familyId,
    name: body.name,
    birthDate: body.birthDate,
    createdAt: new Date().toISOString(),
  });
}

export async function patchBaby(
  familyId: string,
  babyId: string,
  request: Request,
  env: { DB: D1Database }
): Promise<Response> {
  const existing = await db.getBaby(env.DB, familyId, babyId);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const fieldMap: Record<string, string> = {
    name: "name", birthDate: "birth_date", gender: "gender",
    heightCm: "height_cm", bloodType: "blood_type", allergies: "allergies",
    avatarUrl: "avatar_url", notes: "notes",
  };
  const updates: Record<string, string | number | null> = {};
  for (const [apiField, dbCol] of Object.entries(fieldMap)) {
    if (body[apiField] !== undefined) {
      updates[dbCol] = body[apiField] as string | number | null;
    }
  }
  if (Object.keys(updates).length === 0) {
    return Response.json(mapBabyRow(existing));
  }
  await db.updateBaby(env.DB, familyId, babyId, updates);
  const updated = await db.getBaby(env.DB, familyId, babyId);
  return Response.json(mapBabyRow(updated!));
}

export async function deleteBaby(familyId: string, babyId: string, env: { DB: D1Database }): Promise<Response> {
  const ok = await db.deleteBaby(env.DB, familyId, babyId);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
