import type { D1Database } from "@cloudflare/workers-types";
import { getHealth } from "./routes/health";
import { postFamilies } from "./routes/families";
import * as babies from "./routes/babies";
import * as events from "./routes/events";
import * as stats from "./routes/stats";
import { getBearerToken } from "./auth";
import { hashToken } from "./auth";
import * as db from "./db/queries";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // GET /health — no auth
    if (path === "/health" && method === "GET") {
      return getHealth();
    }

    // POST /families — create family, no auth
    if (path === "/families" && method === "POST") {
      return postFamilies(request, env);
    }

    // All other routes require Bearer token
    const token = getBearerToken(request);
    if (!token) {
      return Response.json({ error: "Missing or invalid Authorization" }, { status: 401 });
    }
    const tokenHash = await hashToken(token);
    const family = await db.getFamilyByTokenHash(env.DB, tokenHash);
    if (!family) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }
    const familyId = family.id;

    // Babies
    if (path === "/babies" && method === "GET") return babies.getBabies(familyId, env);
    if (path === "/babies" && method === "POST") return babies.postBabies(request, familyId, env);
    const babiesMatch = path.match(/^\/babies\/([^/]+)$/);
    if (babiesMatch) {
      const babyId = babiesMatch[1];
      if (method === "PATCH") return babies.patchBaby(familyId, babyId, request, env);
      if (method === "DELETE") return babies.deleteBaby(familyId, babyId, env);
    }

    // Events
    if (path === "/events" && method === "POST") return events.postEvents(request, familyId, env);
    if (path === "/events" && method === "GET") return events.getEvents(familyId, env, url);
    const eventsMatch = path.match(/^\/events\/([^/]+)$/);
    if (eventsMatch) {
      const eventId = eventsMatch[1];
      if (method === "PATCH") return events.patchEvent(familyId, eventId, request, env);
      if (method === "DELETE") return events.deleteEvent(familyId, eventId, env);
    }

    // Stats (stubs)
    if (path === "/stats/feeds" && method === "GET") return stats.getStatsFeeds(familyId, url, env);
    if (path === "/stats/weight" && method === "GET") return stats.getStatsWeight(familyId, url, env);
    if (path === "/stats/sleep" && method === "GET") return stats.getStatsSleep(familyId, url, env);

    return new Response("Not Found", { status: 404 });
  },
};
