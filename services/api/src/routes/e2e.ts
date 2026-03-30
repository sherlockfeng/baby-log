import type { D1Database } from "@cloudflare/workers-types";
import { hashToken } from "../auth";

export async function postE2eReset(env: { DB: D1Database }): Promise<Response> {
  await env.DB.exec("DELETE FROM events");
  await env.DB.exec("DELETE FROM babies");
  await env.DB.exec("DELETE FROM families");
  return Response.json({ ok: true });
}

export async function postE2eSeed(request: Request, env: { DB: D1Database }): Promise<Response> {
  let body: {
    families?: Array<{ id: string; name?: string; token: string }>;
    babies?: Array<{ id: string; familyId: string; name: string; birthDate: string }>;
    events?: Array<{ id: string; familyId: string; babyId: string; eventType: string; eventTime: string; payload: unknown }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.families) {
    for (const f of body.families) {
      const tokenHash = await hashToken(f.token);
      await env.DB
        .prepare("INSERT OR REPLACE INTO families (id, name, token_hash) VALUES (?, ?, ?)")
        .bind(f.id, f.name ?? null, tokenHash)
        .run();
    }
  }
  if (body.babies) {
    for (const b of body.babies) {
      await env.DB
        .prepare("INSERT OR REPLACE INTO babies (id, family_id, name, birth_date) VALUES (?, ?, ?, ?)")
        .bind(b.id, b.familyId, b.name, b.birthDate)
        .run();
    }
  }
  if (body.events) {
    for (const e of body.events) {
      await env.DB
        .prepare("INSERT OR REPLACE INTO events (id, family_id, baby_id, event_type, event_time, payload) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(e.id, e.familyId, e.babyId, e.eventType, e.eventTime, JSON.stringify(e.payload))
        .run();
    }
  }

  return Response.json({ ok: true });
}
