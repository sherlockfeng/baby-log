import type { D1Database } from "@cloudflare/workers-types";

function todayRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { from: `${y}-${m}-${d}T00:00:00.000Z`, to: `${y}-${m}-${d}T23:59:59.999Z` };
}

export async function getStatsToday(
  familyId: string,
  url: URL,
  env: { DB: D1Database }
): Promise<Response> {
  const babyId = url.searchParams.get("babyId");
  if (!babyId) {
    return Response.json({ error: "babyId is required" }, { status: 400 });
  }
  const { from, to } = todayRange();

  const feedRows = await env.DB.prepare(
    "SELECT payload FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'feed' AND event_time >= ? AND event_time <= ?"
  ).bind(familyId, babyId, from, to).all<{ payload: string }>();

  let feedCount = 0;
  let feedTotalMl = 0;
  for (const row of feedRows.results ?? []) {
    feedCount++;
    try {
      const p = JSON.parse(row.payload);
      if (p && typeof p.amountMl === "number") feedTotalMl += p.amountMl;
    } catch { /* skip */ }
  }

  const sleepRows = await env.DB.prepare(
    "SELECT payload FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'sleep' AND event_time >= ? AND event_time <= ?"
  ).bind(familyId, babyId, from, to).all<{ payload: string }>();

  let sleepTotalMin = 0;
  for (const row of sleepRows.results ?? []) {
    try {
      const p = JSON.parse(row.payload);
      if (p?.startTime && p?.endTime) {
        const dur = (new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / 60000;
        if (dur > 0) sleepTotalMin += dur;
      }
    } catch { /* skip */ }
  }

  const lastFeed = await env.DB.prepare(
    "SELECT event_time FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'feed' ORDER BY event_time DESC LIMIT 1"
  ).bind(familyId, babyId).first<{ event_time: string }>();

  const lastDiaper = await env.DB.prepare(
    "SELECT event_time FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'diaper' ORDER BY event_time DESC LIMIT 1"
  ).bind(familyId, babyId).first<{ event_time: string }>();

  return Response.json({
    feedCount,
    feedTotalMl,
    sleepTotalMin: Math.round(sleepTotalMin),
    lastFeedTime: lastFeed?.event_time ?? null,
    lastDiaperTime: lastDiaper?.event_time ?? null,
  });
}

export async function getStatsFeeds(
  familyId: string,
  url: URL,
  env: { DB: D1Database }
): Promise<Response> {
  const babyId = url.searchParams.get("babyId");
  if (!babyId) return Response.json({ feeds: [], totalMl: 0 });
  const { from, to } = todayRange();
  const rows = await env.DB.prepare(
    "SELECT payload FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'feed' AND event_time >= ? AND event_time <= ?"
  ).bind(familyId, babyId, from, to).all<{ payload: string }>();
  let totalMl = 0;
  for (const r of rows.results ?? []) {
    try { const p = JSON.parse(r.payload); if (p?.amountMl) totalMl += p.amountMl; } catch { /* skip */ }
  }
  return Response.json({ feeds: rows.results ?? [], totalMl });
}

export async function getStatsWeight(
  familyId: string,
  url: URL,
  env: { DB: D1Database }
): Promise<Response> {
  const babyId = url.searchParams.get("babyId");
  if (!babyId) return Response.json({ points: [], latestKg: null });
  const row = await env.DB.prepare(
    "SELECT payload FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'weight' ORDER BY event_time DESC LIMIT 1"
  ).bind(familyId, babyId).first<{ payload: string }>();
  let latestKg = null;
  if (row) { try { latestKg = JSON.parse(row.payload)?.kg ?? null; } catch { /* skip */ } }
  return Response.json({ points: [], latestKg });
}

export async function getStatsSleep(
  familyId: string,
  url: URL,
  env: { DB: D1Database }
): Promise<Response> {
  const babyId = url.searchParams.get("babyId");
  if (!babyId) return Response.json({ sessions: [], totalMinutes: 0 });
  const { from, to } = todayRange();
  const rows = await env.DB.prepare(
    "SELECT payload FROM events WHERE family_id = ? AND baby_id = ? AND event_type = 'sleep' AND event_time >= ? AND event_time <= ?"
  ).bind(familyId, babyId, from, to).all<{ payload: string }>();
  let totalMinutes = 0;
  for (const r of rows.results ?? []) {
    try {
      const p = JSON.parse(r.payload);
      if (p?.startTime && p?.endTime) {
        const dur = (new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / 60000;
        if (dur > 0) totalMinutes += dur;
      }
    } catch { /* skip */ }
  }
  return Response.json({ sessions: rows.results ?? [], totalMinutes: Math.round(totalMinutes) });
}
