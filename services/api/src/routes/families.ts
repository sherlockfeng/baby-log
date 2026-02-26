import type { D1Database } from "@cloudflare/workers-types";
import * as db from "../db/queries";
import { hashToken } from "../auth";

export async function postFamilies(request: Request, env: { DB: D1Database }): Promise<Response> {
  let body: { name?: string } = {};
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const familyId = crypto.randomUUID();
  const token = crypto.randomUUID() + "-" + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await hashToken(token);
  await db.createFamily(env.DB, familyId, body.name ?? null, tokenHash);
  return Response.json({ familyId, token, name: body.name ?? null });
}
