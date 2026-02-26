import type { D1Database } from "@cloudflare/workers-types";
import * as db from "../db/queries";

export async function getBabies(familyId: string, env: { DB: D1Database }): Promise<Response> {
  const rows = await db.getBabies(env.DB, familyId);
  const babies = rows.map((r) => ({
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    birthDate: r.birth_date,
    createdAt: r.created_at,
  }));
  return Response.json(babies);
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
  let body: { name?: string; birthDate?: string } = {};
  try {
    body = (await request.json()) as { name?: string; birthDate?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { name?: string; birth_date?: string } = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.birthDate !== undefined) updates.birth_date = body.birthDate;
  if (Object.keys(updates).length === 0) {
    return Response.json({
      id: existing.id,
      familyId: existing.family_id,
      name: existing.name,
      birthDate: existing.birth_date,
      createdAt: existing.created_at,
    });
  }
  await db.updateBaby(env.DB, familyId, babyId, updates);
  const updated = await db.getBaby(env.DB, familyId, babyId);
  return Response.json({
    id: updated!.id,
    familyId: updated!.family_id,
    name: updated!.name,
    birthDate: updated!.birth_date,
    createdAt: updated!.created_at,
  });
}

export async function deleteBaby(familyId: string, babyId: string, env: { DB: D1Database }): Promise<Response> {
  const ok = await db.deleteBaby(env.DB, familyId, babyId);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
