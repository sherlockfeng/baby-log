#!/usr/bin/env node
/**
 * Parse napper.html for all <img src, alt>, download images, and create a manifest
 * for design reference. Run from repo root: node scripts/fetch-napper-screenshots.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const REPO_ROOT = path.resolve(__dirname, "..");
const HTML_PATH = path.join(REPO_ROOT, "napper.html");
const OUT_DIR = path.join(REPO_ROOT, "assets", "napper-screenshots");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const README_PATH = path.join(OUT_DIR, "README.md");

function extractImages(html) {
  const imgRegex = /<img[^>]*?src="(https:\/\/[^"]+)"[^>]*?alt="((?:[^"]|"(?!\s*style=))*)"\s*style=/g;
  const list = [];
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    list.push({ url: m[1], alt: m[2].trim() });
  }
  return list;
}

function download(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function main() {
  console.log("Reading", HTML_PATH);
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const images = extractImages(html);
  console.log("Found", images.length, "images");

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const manifest = [];
  const pad = String(images.length).length;
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : images.length;
  const toProcess = images.slice(0, limit);

  async function run() {
    for (let i = 0; i < toProcess.length; i++) {
      const { url, alt } = toProcess[i];
      const num = String(i + 1).padStart(pad, "0");
      const ext = url.includes(".image") ? "png" : (path.extname(new URL(url).pathname) || "png").slice(1) || "png";
      const filename = `napper-${num}.${ext}`;
      const filepath = path.join(OUT_DIR, filename);

      const shortDesc = alt.length > 200 ? alt.slice(0, 197) + "..." : alt;
      manifest.push({
        index: i + 1,
        file: filename,
        url,
        alt,
        shortDesc,
      });

      if (fs.existsSync(filepath)) {
        console.log(`[${i + 1}/${toProcess.length}] Skip (exists) ${filename}`);
        continue;
      }

      try {
        const buf = await download(url);
        fs.writeFileSync(filepath, buf);
        console.log(`[${i + 1}/${toProcess.length}] Saved ${filename}`);
      } catch (e) {
        console.error(`[${i + 1}/${toProcess.length}] Failed ${filename}:`, e.message);
        manifest[manifest.length - 1].error = e.message;
      }

      // Be nice to the server
      await new Promise((r) => setTimeout(r, 150));
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
    console.log("Wrote", MANIFEST_PATH);

    const readme = [
      "# Napper 截图与描述（设计参考）",
      "",
      "本目录由 `scripts/fetch-napper-screenshots.js` 从 `napper.html` 解析并下载。",
      "",
      "## 清单说明",
      "",
      "- `manifest.json`：每张图片与 alt 描述的对应关系，供后续界面设计参考。",
      "- 字段：`index` 序号、`file` 文件名、`url` 原地址、`alt` 完整描述、`shortDesc` 简短描述。",
      "",
      "## 图片列表（序号 → 简短描述）",
      "",
      ...manifest.map(
        (e) =>
          `- **${e.file}** (${e.index}) ${e.shortDesc.replace(/\n/g, " ")}`
      ),
      "",
    ].join("\n");

    fs.writeFileSync(README_PATH, readme, "utf8");
    console.log("Wrote", README_PATH);
  }

  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
