import type { R2Bucket } from "@cloudflare/workers-types";

interface UploadEnv {
  PHOTOS: R2Bucket;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function postUpload(
  request: Request,
  familyId: string,
  env: UploadEnv,
): Promise<Response> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return handleMultipart(request, familyId, env);
  }

  const mimeType = contentType.split(";")[0].trim();
  if (!ALLOWED_TYPES.has(mimeType)) {
    return Response.json(
      { error: `Unsupported type: ${mimeType}. Allowed: ${[...ALLOWED_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_SIZE) {
    return Response.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const key = `${familyId}/${crypto.randomUUID()}.${ext}`;

  await env.PHOTOS.put(key, body, { httpMetadata: { contentType: mimeType } });

  return Response.json({ key, url: `/photos/${key}` });
}

async function handleMultipart(
  request: Request,
  familyId: string,
  env: UploadEnv,
): Promise<Response> {
  const formData = await request.formData();
  const results: { key: string; url: string }[] = [];

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const mimeType = value.type || "image/jpeg";
    if (!ALLOWED_TYPES.has(mimeType)) continue;
    if (value.size > MAX_SIZE) {
      return Response.json({ error: "File too large (max 10 MB)" }, { status: 413 });
    }

    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const key = `${familyId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await value.arrayBuffer();

    await env.PHOTOS.put(key, buffer, { httpMetadata: { contentType: mimeType } });
    results.push({ key, url: `/photos/${key}` });
  }

  if (results.length === 0) {
    return Response.json({ error: "No valid image files found" }, { status: 400 });
  }

  return Response.json({ files: results });
}

export async function getPhoto(key: string, env: UploadEnv): Promise<Response> {
  const object = await env.PHOTOS.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("content-type", object.httpMetadata?.contentType || "image/jpeg");
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
}
