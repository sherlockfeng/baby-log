import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { getHealth } from "./routes/health";
import { postFamilies } from "./routes/families";
import * as babies from "./routes/babies";
import * as events from "./routes/events";
import * as stats from "./routes/stats";
import * as upload from "./routes/upload";
import { postE2eReset, postE2eSeed } from "./routes/e2e";
import { getBearerToken } from "./auth";
import { hashToken } from "./auth";
import * as db from "./db/queries";

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  E2E_ENABLED?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const wrap = (r: Response) => withCors(r);

    // GET /health — no auth
    if (path === "/health" && method === "GET") {
      return wrap(getHealth());
    }

    // POST /families — create family, no auth
    if (path === "/families" && method === "POST") {
      return wrap(await postFamilies(request, env));
    }

    // E2E test helpers — only available when E2E_ENABLED=1 (local dev)
    if (path.startsWith("/e2e/") && env.E2E_ENABLED === "1") {
      if (path === "/e2e/reset" && method === "POST") return wrap(await postE2eReset(env));
      if (path === "/e2e/seed" && method === "POST") return wrap(await postE2eSeed(request, env));
    }

    // All other routes require Bearer token
    const token = getBearerToken(request);
    if (!token) {
      return wrap(Response.json({ error: "Missing or invalid Authorization" }, { status: 401 }));
    }
    const tokenHash = await hashToken(token);
    const family = await db.getFamilyByTokenHash(env.DB, tokenHash);
    if (!family) {
      return wrap(Response.json({ error: "Invalid token" }, { status: 401 }));
    }
    const familyId = family.id;

    // Babies
    if (path === "/babies" && method === "GET") return wrap(await babies.getBabies(familyId, env));
    if (path === "/babies" && method === "POST") return wrap(await babies.postBabies(request, familyId, env));
    const babiesMatch = path.match(/^\/babies\/([^/]+)$/);
    if (babiesMatch) {
      const babyId = babiesMatch[1];
      if (method === "PATCH") return wrap(await babies.patchBaby(familyId, babyId, request, env));
      if (method === "DELETE") return wrap(await babies.deleteBaby(familyId, babyId, env));
    }

    // Events
    if (path === "/events" && method === "POST") return wrap(await events.postEvents(request, familyId, env));
    if (path === "/events" && method === "GET") return wrap(await events.getEvents(familyId, env, url));
    const eventsMatch = path.match(/^\/events\/([^/]+)$/);
    if (eventsMatch) {
      const eventId = eventsMatch[1];
      if (method === "PATCH") return wrap(await events.patchEvent(familyId, eventId, request, env));
      if (method === "DELETE") return wrap(await events.deleteEvent(familyId, eventId, env));
    }

    // Upload
    if (path === "/upload" && method === "POST") return wrap(await upload.postUpload(request, familyId, env));

    // Photos (serve)
    const photoMatch = path.match(/^\/photos\/(.+)$/);
    if (photoMatch && method === "GET") return wrap(await upload.getPhoto(photoMatch[1], env));

    // Stats
    if (path === "/stats/today" && method === "GET") return wrap(await stats.getStatsToday(familyId, url, env));
    if (path === "/stats/feeds" && method === "GET") return wrap(await stats.getStatsFeeds(familyId, url, env));
    if (path === "/stats/weight" && method === "GET") return wrap(await stats.getStatsWeight(familyId, url, env));
    if (path === "/stats/sleep" && method === "GET") return wrap(await stats.getStatsSleep(familyId, url, env));

    return wrap(new Response("Not Found", { status: 404 }));
  },
};
