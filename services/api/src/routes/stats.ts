import type { D1Database } from "@cloudflare/workers-types";

/**
 * v0.1 stubs for stats. Return empty or placeholder data.
 */
export async function getStatsFeeds(
  _familyId: string,
  _url: URL,
  _env: { DB: D1Database }
): Promise<Response> {
  return Response.json({ feeds: [], totalMl: 0 });
}

export async function getStatsWeight(
  _familyId: string,
  _url: URL,
  _env: { DB: D1Database }
): Promise<Response> {
  return Response.json({ points: [], latestKg: null });
}

export async function getStatsSleep(
  _familyId: string,
  _url: URL,
  _env: { DB: D1Database }
): Promise<Response> {
  return Response.json({ sessions: [], totalMinutes: 0 });
}
