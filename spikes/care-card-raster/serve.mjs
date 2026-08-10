/**
 * Minimal static server for the raster spike.
 *
 * Only exists because the capture code fetch()es font files, which file://
 * pages are not allowed to do. Modeled on audit/tools/serve-audit.mjs: no
 * dependencies, no caching, serves the spike directory ONLY so it cannot
 * become a way to expose the repo.
 *
 *   node spikes/care-card-raster/serve.mjs [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.argv[2]) || 4400;
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel === "") rel = "/spike.html";

    // Resolve, then confirm the result is still inside ROOT. Without this a
    // request for /../../.env would happily walk out of the spike directory.
    const target = path.resolve(ROOT, "." + rel);
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("Forbidden");
    }

    const s = await stat(target).catch(() => null);
    if (!s || !s.isFile()) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("Not found: " + rel);
    }

    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(target).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Error: " + e.message);
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`raster spike -> http://localhost:${PORT}/spike.html`);
  console.log(`serving ${ROOT}`);
});
